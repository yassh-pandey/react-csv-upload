import { useRef, useState, memo, useMemo, startTransition } from 'react';
import Papa, { ParseResult, Parser } from 'papaparse';
import { clsx } from 'clsx';
import * as tus from 'tus-js-client';
import { useUploadContext } from '../UploadProvider';
import Progress from '../Progress';
import {
    UploaderProps,
    DEFAULT_PARSING_ERROR_MESSAGE,
    DEFAULT_PLACEHOLDER,
    UploadProgress,
    DEFAULT_UPLOAD_PROGRESS,
} from './types';
import { DEFAULT_PARSING_PROGRESS_STATUS } from '../UploadProvider/types';

import classes from './uploaderStyles.module.css';

const dummyFunction = () => {};

const Uploader = function (props: UploaderProps) {
    const inlineStyle: React.CSSProperties = {};

    const {
        width,
        height,
        showParsingProgress = true,
        showUploadProgress = true,
        placeholder = DEFAULT_PLACEHOLDER,
        parsingChunkSize = 10 * 1024 * 1024, // 10MBs
        handleUploadSuccess = dummyFunction,
        showToastNotifications = true,
        showReset = true,
        maxFileSize = 1024 * 1024 * 1024, // 1 GB
    } = props;

    if (width !== undefined) {
        inlineStyle.width = `${width}px`;
    }
    if (height !== undefined) {
        inlineStyle.height = `${height}px`;
    }

    const checkIfFileAlreadyExists = async function (fileName: string): Promise<boolean> {
        setCheckingFileExists(true);
        try {
            const url = new URL('http://localhost:3000/file-exists');
            url.searchParams.append('access_key', access_key);
            url.searchParams.append('file_name', fileName);
            const response = await fetch(url?.href);
            if (response.status !== 200) {
                throw new Error('Error in fetching whether the file already exists.');
            }
            const data = await response?.json();
            setCheckingFileExists(false);
            return data?.exists;
        } catch (error) {
            setCheckingFileExists(false);
            throw error;
        }
    };

    const parseFile = function (file: File) {
        const fileSize = file.size;
        setParsingState((cs) => ({ ...cs, ...DEFAULT_PARSING_PROGRESS_STATUS, inProgress: true }));
        Papa.parse(file, {
            worker: true,
            header: false,
            dynamicTyping: true,
            skipEmptyLines: true,
            chunkSize: parsingChunkSize,
            chunk: function (results: ParseResult<Array<unknown>>, parser: Parser) {
                parserReference.current = parser;
                startTransition(() => {
                    setParsingState((cs) => ({
                        ...cs,
                        data: [...cs.data, ...results.data],
                        percentParsed: Math.round((results.meta.cursor / fileSize) * 100),
                    }));
                });
            },
            error: () => {
                startTransition(() => {
                    setParsingState((cs) => ({
                        ...cs,
                        inProgress: false,
                        isCompleted: false,
                        headers: [],
                        data: [],
                        isError: true,
                    }));
                });
                if (showToastNotifications && !resetCalled.current) {
                    notify(DEFAULT_PARSING_ERROR_MESSAGE, {
                        type: 'error',
                    });
                }
                return;
            },
            complete: function () {
                setTimeout(() => {
                    startTransition(() => {
                        setParsingState((cs) => ({
                            ...cs,
                            inProgress: false,
                            isCompleted: resetCalled.current ? false : true,
                            headers: cs.data?.[0] ?? [],
                        }));
                    });
                    if (showToastNotifications && !resetCalled.current) {
                        notify('Successfully completed parsing the csv file.', {
                            type: 'success',
                        });
                    }
                    return;
                }, 300);
            },
        });
    };

    const handleFileChange = function (e: React.ChangeEvent<HTMLInputElement>) {
        e.preventDefault();
        if (uploadRef === null || !uploadRef.current?.files || !uploadRef.current?.files?.length) {
            return;
        }
        resetCalled.current = false;
        const file = uploadRef.current?.files[0];
        const fileName = file.name;
        const fileType = file.type;
        const fileSize = file.size;
        if (fileType !== 'text/csv') {
            alert('Only CSV files are allowed.');
            return;
        }
        if (fileSize > maxFileSize) {
            alert('File size bigger than the maximum allowed size.');
            return;
        }
        parseFile(file);
        setFileName(fileName);
    };

    const handleUpload = async function () {
        if (
            uploadRef === null ||
            !uploadRef.current?.files ||
            !uploadRef.current?.files?.length ||
            !parsingState?.data?.length
        ) {
            return;
        }
        const file = uploadRef.current?.files[0];
        const fileName = file?.name;
        const fileType = file?.type;
        let replace_existing = false;
        try {
            const exists = await checkIfFileAlreadyExists(fileName);
            if (exists) {
                const userResponse = window.confirm(
                    `A file with this name: ${fileName} already exists. Do you still wish to proceed with the upload? If you select OK then we will override the existing file.`
                );
                replace_existing = userResponse;
            }
            if (exists === true && replace_existing === false) {
                return;
            }
        } catch (error) {
            if (showToastNotifications && !resetCalled.current) {
                notify(
                    'Some uexpected error happened while checking whether the file already exists. Please try again.',
                    {
                        type: 'error',
                    }
                );
            }
            return;
        }
        // Create a new tus upload
        uploadControllerRef.current = new tus.Upload(file, {
            endpoint: 'http://localhost:3000/uploads/',
            retryDelays: null,
            removeFingerprintOnSuccess: true,
            metadata: {
                file_name: fileName,
                file_type: fileType,
                access_key: access_key,
                replace_existing: String(replace_existing),
                columns: JSON.stringify(parsingState.data[0]),
            },
            storeFingerprintForResuming: true,
            onBeforeRequest: function () {
                setFileUploadInProgress((cs) => ({
                    ...cs,
                    isError: false,
                    inProgress: true,
                    isCompleted: false,
                    percentage: cs.percentage === 100 ? 0 : cs.percentage,
                }));
            },
            onError: function () {
                setFileUploadInProgress((cs) => ({ ...cs, inProgress: false, isError: true, isCompleted: false }));
                if (showToastNotifications && !resetCalled.current) {
                    notify('Some uexpected error happened while uploading the csv file. Please try again.', {
                        type: 'error',
                    });
                }
                return;
            },
            onProgress: function (bytesUploaded, bytesTotal) {
                const percentage = Number.parseFloat(((bytesUploaded / bytesTotal) * 100).toFixed(2));
                setFileUploadInProgress((cs) => ({ ...cs, percentage }));
            },
            onSuccess: async function () {
                setFileUploadInProgress((cs) => ({
                    ...cs,
                    inProgress: false,
                    isError: false,
                    isCompleted: true,
                    percentage: 0,
                }));
                if (showToastNotifications && !resetCalled.current) {
                    notify('Successfully uploaded CSV file.', {
                        type: 'success',
                    });
                }
                await handleUploadSuccess();
            },
        });

        startOrResumeUpload(uploadControllerRef.current);
    };

    const abortParsing = () => {
        const parser = parserReference?.current;
        if (parser !== null) {
            parser?.abort();
        }
    };

    const handleResetClick = () => {
        resetCalled.current = true;
        dismissAll();
        if (parsingState.inProgress) {
            abortParsing();
        }
        if (
            fileUploadInProgress?.inProgress &&
            fileUploadInProgress.percentage !== 100 &&
            uploadControllerRef?.current !== null
        ) {
            uploadControllerRef?.current?.abort(true);
        }
        setFileUploadInProgress(DEFAULT_UPLOAD_PROGRESS);
        setParsingState(DEFAULT_PARSING_PROGRESS_STATUS);
        parserReference.current = null;
        setCheckingFileExists(false);
        setFileName('');
        if (formWrapperRef?.current) {
            formWrapperRef?.current?.reset();
        }
    };

    const handleFileDrop = (file: File) => {
        const fileName = file.name;
        const fileSize = file.size;
        const fileType = file.type;
        if (fileType !== 'text/csv') {
            alert('Only CSV files are allowed.');
            return;
        }
        if (fileSize > maxFileSize) {
            alert('File size bigger than the maximum allowed size.');
            return;
        }
        resetCalled.current = false;
        parseFile(file);
        setFileName(fileName);
    };

    const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (!dndZoneRef.current) {
            return;
        }
        dndZoneRef.current.classList.remove(classes['valid-file-drop']);
        dndZoneRef.current.classList.remove(classes['invalid-file-drop']);
        const file = e.dataTransfer.files[0];
        handleFileDrop(file);
    };
    const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e?.preventDefault();
    };
    const onDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        if (!dndZoneRef.current) {
            return;
        }
        const isCSV = Array.from(e.dataTransfer.items).some((item) => item.type === 'text/csv');
        if (isCSV) {
            dndZoneRef.current.classList.add(classes['valid-file-drop']);
        } else {
            dndZoneRef.current.classList.add(classes['invalid-file-drop']);
        }
    };
    const onDragLeave = () => {
        if (!dndZoneRef.current) {
            return;
        }
        dndZoneRef.current.classList.remove(classes['valid-file-drop']);
        dndZoneRef.current.classList.remove(classes['invalid-file-drop']);
    };

    const terminateUpload = () => {
        const controller = uploadControllerRef?.current;
        if (controller === null) {
            return;
        }
        controller.abort(true);
        setFileUploadInProgress(DEFAULT_UPLOAD_PROGRESS);
    };

    const pauseUpload = () => {
        const controller = uploadControllerRef?.current;
        if (controller === null) {
            return;
        }
        setFileUploadInProgress((cs) => ({
            ...cs,
            isPaused: true,
        }));
        controller.abort();
    };

    const resumeUpload = () => {
        const controller = uploadControllerRef?.current;
        if (controller === null) {
            return;
        }
        setFileUploadInProgress((cs) => ({
            ...cs,
            isPaused: false,
        }));
        startOrResumeUpload(controller);
    };

    function startOrResumeUpload(upload: tus.Upload) {
        // Check if there are any previous uploads to continue.
        upload.findPreviousUploads().then(function (previousUploads) {
            // Found previous uploads so we select the first one.
            if (previousUploads.length) {
                upload.resumeFromPreviousUpload(previousUploads[0]);
            }

            // Start the upload
            upload.start();
        });
    }

    const formWrapperRef = useRef<HTMLFormElement | null>(null);
    const uploadRef = useRef<HTMLInputElement | null>(null);
    const [checkingFileExists, setCheckingFileExists] = useState<boolean>(false);
    const [fileUploadInProgress, setFileUploadInProgress] = useState<UploadProgress>(DEFAULT_UPLOAD_PROGRESS);
    const [fileName, setFileName] = useState<string>('');
    const { parsingState, setParsingState, access_key, notify, dismissAll } = useUploadContext();
    const parserReference = useRef<Parser | null>(null);
    const resetCalled = useRef<boolean>(false);
    const dndZoneRef = useRef<HTMLDivElement | null>(null);
    const uploadControllerRef = useRef<tus.Upload | null>(null);

    const uploadButtonTitle = useMemo(() => {
        if (checkingFileExists) {
            return 'Checking if file exists...';
        } else if (parsingState?.inProgress && !parsingState.isError) {
            return 'Parsing CSV file...';
        } else if (
            !fileUploadInProgress.isCompleted &&
            fileUploadInProgress.inProgress &&
            !fileUploadInProgress.isError &&
            fileUploadInProgress.percentage !== 100
        ) {
            return 'Uploading...';
        } else if (
            fileUploadInProgress.percentage === 100 &&
            !fileUploadInProgress.isCompleted &&
            !fileUploadInProgress.isError
        ) {
            return 'Copying file to db...';
        } else {
            return 'Upload';
        }
    }, [
        checkingFileExists,
        parsingState.inProgress,
        parsingState.isError,
        fileUploadInProgress.percentage,
        fileUploadInProgress.isCompleted,
        fileUploadInProgress.isError,
    ]);

    const renderParsingProgress = useMemo(() => {
        if (!showParsingProgress) {
            return false;
        }
        if (parsingState.inProgress && !parsingState.isError && !parsingState.isCompleted) {
            return true;
        } else {
            return false;
        }
    }, [showParsingProgress, parsingState.inProgress, parsingState.isError]);

    const renderUploadProgress = useMemo(() => {
        if (!showUploadProgress) {
            return false;
        }
        if (fileUploadInProgress.inProgress && !fileUploadInProgress.isError && !fileUploadInProgress.isCompleted) {
            return true;
        } else {
            return false;
        }
    }, [showUploadProgress, fileUploadInProgress.inProgress, fileUploadInProgress.isError]);

    return (
        <div className={classes.container}>
            <div
                ref={dndZoneRef}
                style={inlineStyle}
                className={classes.dndZone}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragEnter={onDragEnter}
                onDragLeave={onDragLeave}
            >
                <form ref={formWrapperRef} className={classes.fileSelectorFormWrapper}>
                    <input
                        ref={uploadRef}
                        type="file"
                        accept=".csv"
                        className={classes.fileSelector}
                        onChange={handleFileChange}
                    />
                </form>
                <p>{fileName ? fileName : placeholder}</p>
            </div>
            {renderParsingProgress ? (
                <Progress
                    handleAbortClick={abortParsing}
                    playControls={{ abort: true }}
                    width={400}
                    percentage={parsingState.percentParsed}
                />
            ) : null}
            {renderUploadProgress ? (
                <Progress
                    handleAbortClick={terminateUpload}
                    handlePauseClick={pauseUpload}
                    handlePlayClick={resumeUpload}
                    playControls={{
                        play:
                            !fileUploadInProgress.isCompleted &&
                            fileUploadInProgress?.isPaused &&
                            !fileUploadInProgress.isError &&
                            fileUploadInProgress.percentage !== 100,
                        pause:
                            !fileUploadInProgress.isCompleted &&
                            !fileUploadInProgress.isPaused &&
                            !fileUploadInProgress.isError &&
                            fileUploadInProgress.percentage !== 100,
                        abort: fileUploadInProgress.percentage !== 100,
                        finalProcessing:
                            fileUploadInProgress.percentage === 100 &&
                            !fileUploadInProgress.isCompleted &&
                            !fileUploadInProgress.isError,
                    }}
                    width={400}
                    percentage={fileUploadInProgress.percentage}
                />
            ) : null}
            <div className={classes.buttonGroup}>
                <button
                    disabled={!parsingState.isCompleted}
                    className={clsx(
                        { [classes.button]: true },
                        { [classes.uploadButton]: true },
                        {
                            [classes.buttonDisabled]:
                                !parsingState.isCompleted ||
                                checkingFileExists ||
                                parsingState.isError ||
                                fileUploadInProgress.inProgress,
                        }
                    )}
                    onClick={handleUpload}
                >
                    {uploadButtonTitle}
                </button>
                {showReset ? (
                    <button
                        onClick={handleResetClick}
                        className={clsx(
                            { [classes.button]: true },
                            { [classes.resetButton]: true },
                            {
                                [classes.buttonDisabled]:
                                    !fileName ||
                                    (fileUploadInProgress.percentage === 100 &&
                                        !fileUploadInProgress.isCompleted &&
                                        !fileUploadInProgress.isError),
                            }
                        )}
                    >
                        Reset
                    </button>
                ) : null}
            </div>
        </div>
    );
};

export default memo(Uploader);
