import { ReactNode } from 'react';
import { Id, ToastOptions, ToastContent } from 'react-toastify';

export interface UploadProviderProps {
    children: ReactNode;
    access_key: string;
}

export interface ParsingProgress {
    inProgress: boolean;
    isCompleted: boolean;
    isError: boolean;
    data: Array<Array<unknown>>;
    headers: unknown[];
    percentParsed: number;
}

export const DEFAULT_PARSING_PROGRESS_STATUS: ParsingProgress = {
    inProgress: false,
    isCompleted: false,
    isError: false,
    data: [],
    headers: [],
    percentParsed: 0,
};

export interface UploadContextType {
    parsingState: ParsingProgress;
    setParsingState: React.Dispatch<React.SetStateAction<ParsingProgress>>;
    access_key: string;
    notify: (content: ToastContent, data: ToastOptions) => Id;
    dismiss: (id: Id) => void;
    dismissAll: () => void;
}
