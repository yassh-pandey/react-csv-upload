export interface UploaderProps {
    width?: number;
    height?: number;
    placeholder?: string;
    showUploadProgress?: boolean;
    showParsingProgress?: boolean;
    parsingChunkSize?: number;
    maxFileSize?: number;
    handleUploadSuccess?: () => Promise<void>;
    showToastNotifications?: boolean;
    showReset?: boolean;
}

export interface UploadProgress {
    percentage: number;
    inProgress: boolean;
    isCompleted: boolean;
    isError: boolean;
    isPaused: boolean;
}

export const DEFAULT_UPLOAD_PROGRESS: UploadProgress = {
    percentage: 0,
    isCompleted: false,
    inProgress: false,
    isError: false,
    isPaused: false,
};

export const DEFAULT_PLACEHOLDER = 'Upload your csv file or drag and drop it here';
export const DEFAULT_PARSING_ERROR_MESSAGE =
    'Some unexpected error happened while parsing your cvs file. Please try again later. If the problem still persists than contact support.';
