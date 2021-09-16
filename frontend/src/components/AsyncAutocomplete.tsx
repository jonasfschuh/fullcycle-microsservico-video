import * as React from 'react';
import { Autocomplete, AutocompleteProps, /*UseAutocompleteSingleProps*/ } from "@material-ui/lab";
import { TextFieldProps } from "@material-ui/core/TextField";
import { CircularProgress, TextField } from "@material-ui/core";
import { useState, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { useImperativeHandle } from "react";
import { RefAttributes } from "react";

interface AsyncAutocompleteProps extends RefAttributes<AsyncAutocompleteComponent> {
    fetchOptions: (searchText) => Promise<any>;
    debounceTime?: number;
    TextFieldProps?: TextFieldProps;
    AutocompleteProps?: Omit<AutocompleteProps, 'renderInput'> /*& UseAutocompleteSingleProps*/;
}

export interface AsyncAutocompleteComponent {
    clear: () => void;
}

const AsyncAutocomplete = React.forwardRef<AsyncAutocompleteComponent, AsyncAutocompleteProps>((props, ref) => {

    const { AutocompleteProps, debounceTime = 300, fetchOptions } = props;
    const { freeSolo = false, onOpen, onClose, onInputChange } = AutocompleteProps as any;
    const [open, setOpen] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [debouncedSearchText] = useDebounce(searchText, debounceTime);
    const [loading, setLoading] = useState(false);
    const [options, setOptions] = useState([]);

    const textFieldProps: TextFieldProps = {
        margin: 'normal',
        variant: 'outlined',
        fullWidth: true,
        InputLabelProps: { shrink: true },
        ...(props.TextFieldProps && { ...props.TextFieldProps })
    };

    const autocompleteProps: AutocompleteProps = {
        loadingText: 'Carregando...',
        noOptionsText: 'Nenhum item encontrado',
        ...(AutocompleteProps && { ...AutocompleteProps }),
        open,
        options,
        loading: loading,
        inputValue: searchText,
        onOpen() {
            setOpen(true);
            onOpen && onOpen();
        },
        onClose() {
            setOpen(false);
            onClose && onClose();
        },
        onInputChange(event, value) {
            setSearchText(value);
            onInputChange && onInputChange();
        },
        renderInput: params => {
            return <TextField
                {...params}
                {...textFieldProps}
                InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                        <>
                            {loading && <CircularProgress color={"inherit"} size={20} />}
                            {params.InputProps.endAdornment}
                        </>
                    )
                }}
            />
        }
    };

    useEffect(() => {
        if (!open && !freeSolo) {
            setOptions([]);
        }
    }, [open, freeSolo]);

    useEffect(() => {
        if (!open) {
            return;
        }
        if (debouncedSearchText === "" && freeSolo) {
            return;
        }


        let isSubscribed = true;
        (async () => {
            setLoading(true);
            try {
                const data = await fetchOptions(debouncedSearchText);
                if (isSubscribed) {
                    setOptions(data);
                }
            } finally {
                setLoading(false);
            }
        })();
        return () => {
            isSubscribed = false;
        }
    }, [freeSolo, debouncedSearchText, open, fetchOptions]);

    useImperativeHandle(ref, () => ({
        clear: () => {
            setSearchText("");
            setOptions([]);
        }
    }));

    return (
        <Autocomplete {...autocompleteProps} />
    );
});

export default AsyncAutocomplete;
