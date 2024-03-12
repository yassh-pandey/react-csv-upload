import { memo } from 'react';
import classes from './progressStyles.module.css';
import PlayCircleFilledWhiteIcon from '@mui/icons-material/PlayCircleFilledWhite';
import PauseCircleFilledIcon from '@mui/icons-material/PauseCircleFilled';
import CancelIcon from '@mui/icons-material/Cancel';
import SyncIcon from '@mui/icons-material/Sync';
import { clsx } from 'clsx';

interface PlayControls {
    play: boolean;
    pause: boolean;
    abort: boolean;
    finalProcessing: boolean;
}

interface ParsingProgressProps {
    width?: number;
    height?: number;
    backgroundColor?: string;
    progressColor?: string;
    playControls?: Partial<PlayControls>;
    handlePlayClick?: () => void;
    handlePauseClick?: () => void;
    handleAbortClick?: () => void;
    percentage: number;
}

const DEFAULT_PLAY_CONTROLS: PlayControls = {
    play: false,
    pause: false,
    abort: false,
    finalProcessing: false,
};

const dummyFunction = function () {};

const Progress = function (props: ParsingProgressProps) {
    const {
        width,
        height,
        backgroundColor,
        progressColor,
        percentage,
        playControls = DEFAULT_PLAY_CONTROLS,
        handlePlayClick = dummyFunction,
        handlePauseClick = dummyFunction,
        handleAbortClick = dummyFunction,
    } = props;

    const { play = false, pause = false, abort = false, finalProcessing = false } = playControls;

    const containerInlineStyle: React.CSSProperties = {};

    const progressBarInlineStyle: React.CSSProperties = {
        width: `${percentage}%`,
    };

    if (width) {
        containerInlineStyle.width = width;
    }
    if (height) {
        containerInlineStyle.height = height;
    }
    if (backgroundColor) {
        containerInlineStyle.backgroundColor = backgroundColor;
    }
    if (progressColor) {
        progressBarInlineStyle.backgroundColor = progressColor;
    }

    return (
        <>
            <div className={classes.progressContainer} style={containerInlineStyle}>
                <div className={classes.progressWrapper}>
                    <div className={classes.progress} style={progressBarInlineStyle} />
                </div>
                <div className={classes.playControls}>
                    {play ? (
                        <PlayCircleFilledWhiteIcon onClick={handlePlayClick} className={classes.playButtons} />
                    ) : null}
                    {pause ? (
                        <PauseCircleFilledIcon onClick={handlePauseClick} className={classes.playButtons} />
                    ) : null}
                    {abort ? <CancelIcon onClick={handleAbortClick} className={classes.playButtons} /> : null}
                    {finalProcessing ? (
                        <SyncIcon onClick={handleAbortClick} className={clsx([classes.finalProcessing])} />
                    ) : null}
                </div>
            </div>
        </>
    );
};

export default memo(Progress);
