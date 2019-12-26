import { CommandServerState } from "@minesweeper/server";
import React, { useLayoutEffect, useRef } from 'react';
import { useServerState } from "./hooks";

export const LoadingDialog = () => {
    const state = useServerState();
    const dialog = useRef<HTMLDialogElement>(null);
    useLayoutEffect(() => {
        if (dialog.current) {
            switch (state) {
                case CommandServerState.CLOSED:
                case CommandServerState.CONNECTING:
                    if (dialog.current && !dialog.current.open) {
                        dialog.current.showModal();
                    }
                    break;
                case CommandServerState.CONNECTED:
                    if (dialog.current && dialog.current.open) {
                        dialog.current && dialog.current.close();
                    }
                    break;
            }
        }
    }, [state]);
    return (
        <dialog ref={ dialog } className='server-state-dialog'>
            {
                state === CommandServerState.CONNECTING && '...Connecting'
            }
            {
                state === CommandServerState.CLOSED && 'Connection closed'
            }
        </dialog>
    )
};
