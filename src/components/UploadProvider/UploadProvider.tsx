import React, { createContext, useContext, useState, memo, useCallback, useRef } from 'react';
import { DEFAULT_PARSING_PROGRESS_STATUS, ParsingProgress, UploadContextType, UploadProviderProps } from './types';
import { ToastContainer, toast, Id, ToastOptions, ToastContent } from 'react-toastify';

import 'react-toastify/dist/ReactToastify.min.css';

const UploadContext = createContext<UploadContextType | undefined>(undefined);
const TOAST_CONTAINER_ID = 'UploadProvider';

const UploadProvider: React.FC<UploadProviderProps> = (props) => {
    const { access_key, children } = props;

    const [parsingState, setParsingState] = useState<ParsingProgress>(DEFAULT_PARSING_PROGRESS_STATUS);
    const notify = useCallback((content: ToastContent, data: ToastOptions) => {
        const id = toast(content, {
            ...data,
            containerId: 'UploadProvider',
        });
        toastsRef.current.push(id);
        return id;
    }, []);
    const dismiss = useCallback((id: Id) => {
        const newRef = toastsRef.current.filter((toastId) => toastId !== id);
        toastsRef.current = newRef;
        toast.dismiss({ containerId: TOAST_CONTAINER_ID, id });
        return;
    }, []);

    const dismissAll = useCallback(() => {
        toastsRef.current.forEach((toastId) =>
            toast.dismiss({
                containerId: TOAST_CONTAINER_ID,
                id: toastId,
            })
        );
        toastsRef.current = [];
        return;
    }, []);

    const toastsRef = useRef<Array<Id>>([]);

    const uploadContextValue: UploadContextType = {
        parsingState,
        setParsingState,
        access_key,
        notify,
        dismiss,
        dismissAll,
    };

    return (
        <UploadContext.Provider value={uploadContextValue}>
            <>
                <>{children}</>
                <ToastContainer containerId={TOAST_CONTAINER_ID} position="bottom-left" theme="dark" hideProgressBar />
            </>
        </UploadContext.Provider>
    );
};

export const useUploadContext = (): UploadContextType => {
    const context = useContext(UploadContext);
    if (context === undefined) {
        throw new Error('useUploadContext must be used within a UploadProvider');
    }
    return context;
};

export default memo(UploadProvider);
