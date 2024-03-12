import { memo, useState, useEffect } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { useUploadContext } from '../UploadProvider';
import { Cell } from './components';
import classes from './diplayGridStyles.module.css';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import LastPageIcon from '@mui/icons-material/LastPage';

interface DisplayGridProps {
    width?: number;
    height?: number;
    rowHeight: number;
    columnHeight: number;
    pageSize?: number;
    showToastNotifications?: boolean;
}

const DisplayGrid = function (props: DisplayGridProps) {
    const { width, height, rowHeight, columnHeight, pageSize = 1000, showToastNotifications = true } = props;

    const { parsingState, notify } = useUploadContext();
    const { headers } = parsingState;

    // Number of items per page
    let PAGE_SIZE = pageSize;

    if (parsingState?.data?.length <= pageSize) {
        PAGE_SIZE = parsingState?.data?.length;
    }

    const containerInlineStyle: React.CSSProperties = {};

    if (width) {
        containerInlineStyle.width = `${width}px`;
    }
    if (height) {
        containerInlineStyle.height = `${height}px`;
    }

    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [pagedData, setPagedData] = useState<any>([]);

    useEffect(() => {
        setCurrentPage(0);
    }, [parsingState.isCompleted]);

    useEffect(() => {
        // Calculate total number of pages
        const total = Math.ceil(parsingState?.data?.length / PAGE_SIZE);
        setTotalPages(total);

        // Fetch data for the current page
        const startIndex = currentPage * PAGE_SIZE;
        const endIndex = Math.min(startIndex + PAGE_SIZE, parsingState?.data.length);
        const pageData = parsingState?.data?.slice(startIndex, endIndex);
        setPagedData(pageData);
    }, [parsingState?.data, currentPage]);

    const handleNextPage = () => {
        setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages - 1));
    };

    const handlePrevPage = () => {
        setCurrentPage((prevPage) => Math.max(prevPage - 1, 0));
    };

    const handleFirstPage = () => {
        setCurrentPage(0);
    };

    const handleLastPage = () => {
        setCurrentPage(totalPages - 1);
    };

    return (
        <>
            {parsingState?.isCompleted && !parsingState.isError ? (
                <div className={classes.container} style={containerInlineStyle}>
                    <div className={classes.autoSizerContainer}>
                        <AutoSizer>
                            {({ height, width }) => {
                                return (
                                    <>
                                        <Grid
                                            columnCount={parsingState?.headers?.length ?? 0}
                                            columnWidth={columnHeight}
                                            rowHeight={rowHeight}
                                            width={width}
                                            height={height}
                                            rowCount={pagedData?.length ?? 0}
                                            itemData={{ pagedData, headers, notify, showToastNotifications }}
                                        >
                                            {Cell}
                                        </Grid>
                                    </>
                                );
                            }}
                        </AutoSizer>
                    </div>
                    <div className={classes['pagination-container']}>
                        <FirstPageIcon className={classes.navigationArrows} onClick={handleFirstPage} />
                        <ArrowBackIosNewIcon className={classes.navigationArrows} onClick={handlePrevPage} />
                        <div>
                            {currentPage + 1} of {totalPages}
                        </div>
                        <ArrowForwardIosIcon className={classes.navigationArrows} onClick={handleNextPage} />
                        <LastPageIcon className={classes.navigationArrows} onClick={handleLastPage} />
                    </div>
                </div>
            ) : null}
        </>
    );
};

export default memo(DisplayGrid);
