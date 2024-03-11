import { memo } from 'react';
import classes from './cellStyles.module.css';
import { Tooltip, TooltipTrigger, TooltipContent } from '../Tooltip';
import { clsx } from 'clsx';

interface CellProps {
    data: any;
    columnIndex: number;
    rowIndex: number;
    style: React.CSSProperties;
}

const handleCellClick = async (text: string, toast: any, showToastNotifications: any) => {
    try {
        await navigator.clipboard.writeText(text);
        if (showToastNotifications) {
            toast('Successfully copied the cell content to clipboard.', {
                type: 'success',
            });
        }
    } catch (error) {
        if (showToastNotifications) {
            toast('Some error happed while trying to copy the cell content to clipboard.', {
                type: 'error',
            });
        }
    }
};

const Cell = (props: CellProps) => {
    const { data, columnIndex, rowIndex, style } = props;
    const { pagedData, headers, notify, showToastNotifications } = data;
    return (
        <div
            style={style}
            className={classes.container}
            onClick={() => handleCellClick(pagedData[rowIndex][columnIndex], notify, showToastNotifications)}
        >
            <Tooltip>
                <TooltipTrigger>
                    <div className={clsx({ [classes.content]: true })}>{pagedData[rowIndex][columnIndex]}</div>
                </TooltipTrigger>
                <TooltipContent>{headers[columnIndex]}</TooltipContent>
            </Tooltip>
        </div>
    );
};

export default memo(Cell);
