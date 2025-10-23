import * as React from "react";
import dayjs, { Dayjs } from "dayjs";
import TextField from "@mui/material/TextField";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import {
  DatePicker,
  DatePickerProps,
  DatePickerFieldProps,
} from "@mui/x-date-pickers/DatePicker";
import {
  useSplitFieldProps,
  useParsedFormat,
  usePickerContext,
} from "@mui/x-date-pickers/hooks";
import { useValidation, validateDate } from "@mui/x-date-pickers/validation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import { DemoItem } from "@mui/x-date-pickers/internals/demo";
import { CalendarToday, Clear } from "@mui/icons-material"; // Import icons// Import icons
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";

// CustomDateField component to handle 'd' input, display formatting, and render icons
function CustomDateField(
  props: DatePickerFieldProps<Dayjs> & {
    clearable?: boolean;
    onClear?: () => void;
  }
) {
  // Extract custom props and then pass to useSplitFieldProps
  const { clearable, onClear, ...restOfCustomFieldProps } = props;
  const { internalProps, forwardedProps } = useSplitFieldProps(
    restOfCustomFieldProps,
    "date"
  );
  const pickerContext = usePickerContext<Dayjs>();
  const placeholder = useParsedFormat();
  const [inputValue, setInputValue] = useInputValue();

  const { hasValidationError } = useValidation({
    value: pickerContext.value,
    timezone: pickerContext.timezone,
    props: internalProps,
    validator: validateDate,
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newInputValue = event.target.value;
    setInputValue(newInputValue);

    // Only attempt to parse if it's not the special 'd' character
    if (newInputValue.toLowerCase() !== "d") {
      const newValue = dayjs(newInputValue, pickerContext.fieldFormat);
      pickerContext.setValue(newValue);
    }
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const currentInput = event.target.value;

    if (currentInput.toLowerCase() === "d") {
      const today = dayjs();
      pickerContext.setValue(today);
      setInputValue(createInputValue(today, pickerContext.fieldFormat)); // Update input field to formatted date
    } else {
      // Ensure the picker context value is up-to-date even if 'd' wasn't entered
      const newValue = dayjs(currentInput, pickerContext.fieldFormat);
      pickerContext.setValue(newValue);
    }

    if ((forwardedProps as any).onBlur) {
      (forwardedProps as any).onBlur(event); // Call original onBlur if it exists
    }
  };

  const handleClearClick = () => {
    pickerContext.setValue(null);
    if (onClear) {
      onClear();
    }
  };

  // Construct the custom endAdornment
  const customEndAdornment = (
    <InputAdornment position="end">
      {clearable &&
        pickerContext.value && ( // Only show clear icon if clearable and a value exists
          <IconButton onClick={handleClearClick} edge="end" size="small">
            <Close fontSize="small" />
          </IconButton>
        )}
      <IconButton
        onClick={() => pickerContext.setOpen(true)}
        edge="end"
        size="small"
      >
        <CalendarToday fontSize="small" />
      </IconButton>
    </InputAdornment>
  );

  return (
    <TextField
      {...forwardedProps} // Spread all forwarded props
      placeholder={placeholder}
      value={inputValue}
      onChange={handleChange}
      onBlur={handleBlur}
      error={hasValidationError}
      focused={pickerContext.open}
      label={pickerContext.label}
      name={pickerContext.name}
      className={pickerContext.rootClassName}
      sx={pickerContext.rootSx}
      ref={pickerContext.rootRef}
      InputProps={{
        ...(forwardedProps as any).InputProps, // Merge any InputProps from forwardedProps
        endAdornment: customEndAdornment, // Override/set our custom endAdornment
      }}
    />
  );
}

// Helper hook to manage input value synchronization with pickerContext
function useInputValue() {
  const pickerContext = usePickerContext<Dayjs>();
  const [lastValueProp, setLastValueProp] = React.useState<Dayjs | null>(
    pickerContext.value
  );
  const [inputValue, setInputValue] = React.useState(() =>
    createInputValue(pickerContext.value, pickerContext.fieldFormat)
  );

  React.useEffect(() => {
    // Only update inputValue if pickerContext.value has genuinely changed
    // This prevents unnecessary re-renders or resetting input if the user is typing
    if (
      !dayjs.isDayjs(pickerContext.value) ||
      !pickerContext.value.isSame(lastValueProp) ||
      (lastValueProp === null && pickerContext.value !== null) ||
      (lastValueProp !== null && pickerContext.value === null)
    ) {
      setLastValueProp(pickerContext.value);
      setInputValue(
        createInputValue(pickerContext.value, pickerContext.fieldFormat)
      );
    }
  }, [pickerContext.value, pickerContext.fieldFormat, lastValueProp]);

  return [inputValue, setInputValue] as const;
}

// Helper function to format the Dayjs object into a string for the input field
function createInputValue(value: Dayjs | null, format: string) {
  if (value === null) {
    return "";
  }
  return value.isValid() ? value.format(format) : "";
}

// Wrapper component to use CustomDateField with DatePicker
function CustomFieldDatePicker(props: DatePickerProps<Dayjs>) {
  const { slots, clearable, onClear, ...restProps } = props;
  return (
    <DatePicker
      slots={{
        ...slots,
        field: (fieldProps) => (
          <CustomDateField
            {...fieldProps}
            clearable={clearable} // Pass clearable to the custom field
            onClear={onClear} // Pass onClear to the custom field
          />
        ),
      }}
      clearable={clearable} // Keep on DatePicker for internal logic if any
      onClear={onClear} // Keep on DatePicker for internal logic if any
      {...restProps}
    />
  );
}

// Main application component
export default function CustomFieldFormat() {
  const [value, setValue] = React.useState<Dayjs | null>(null);
  const [cleared, setCleared] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (cleared) {
      const timeout = setTimeout(() => {
        setCleared(false);
      }, 1500);

      return () => clearTimeout(timeout);
    }
    return () => {};
  }, [cleared]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
        }}
      >
        <DemoItem label="Custom Date Field">
          <CustomFieldDatePicker
            sx={{ width: "300px" }}
            value={value}
            onChange={(newValue) => setValue(newValue)}
            onClear={() => setCleared(true)}
            clearable
            format="MM-DD-YYYY" // Example format for display
          />
        </DemoItem>
        {cleared && !value && (
          <Alert
            sx={{ position: "absolute", bottom: 16, right: 16 }}
            severity="success"
          >
            Field cleared!
          </Alert>
        )}
      </Box>
    </LocalizationProvider>
  );
}
