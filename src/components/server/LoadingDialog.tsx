import { CommandServerState } from "@minesweeper/server";
import React, { useLayoutEffect, useRef } from 'react';
import { useServerState } from "../../server/hooks";

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
                case CommandServerState.CONNECTED:
                    if (dialog.current && dialog.current.open) {
                        dialog.current && dialog.current.close();
                    }
            }
        }
    }, [state]);
    return (
        <dialog ref={ dialog } className='server-state-dialog'>
            {
                CommandServerState.CONNECTING && '...Connecting'
            }
            {
                CommandServerState.CLOSED && 'Connection closed'
            }
        </dialog>
    )
};
