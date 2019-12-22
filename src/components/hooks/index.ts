import { useEffect, useState } from "react";

export const useMetaKeyDown = (): boolean => {
    const [state, setState] = useState(false);
    useEffect(() => {
        const onKeydown = (e: KeyboardEvent) => setState(e.metaKey);
        window.addEventListener('keydown', onKeydown);
        window.addEventListener('keyup', () => setState(false));
        return () => window.removeEventListener('keydown', onKeydown);
    }, []);
    return state;
};
