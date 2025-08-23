import { createTheme } from "@mantine/core"

import { NotificationUtil } from "@/utils/NotificationUtil"
import {
  ActionIcon,
  Autocomplete,
  Button,
  Combobox,
  LoadingOverlay,
  Modal,
  MultiSelect,
  NavLink,
  NumberInput,
  Pagination,
  PasswordInput,
  Popover,
  Select,
  Table,
  TagsInput,
  Textarea,
  TextInput,
  Tooltip,
} from "@mantine/core"
import { DatePickerInput, MonthPickerInput } from "@mantine/dates"
import { Dropzone } from "@mantine/dropzone"
import { IconChevronDown } from "@tabler/icons-react"
import { colors } from "./colors"
import ActionIconClasses from "./cssModules/ActionIcon.module.css"
import AutocompleteClasses from "./cssModules/Autocomplete.module.css"
import ButtonClasses from "./cssModules/Button.module.css"
import DatePickerInputClasses from "./cssModules/DatePickerInput.module.css"
import DropzoneClasses from "./cssModules/Dropzone.module.css"
import MonthPickerInputClasses from "./cssModules/MonthPickerInput.module.css"
import MultiSelectClasses from "./cssModules/MultiSelect.module.css"
import NavLinkClasses from "./cssModules/NavLink.module.css"
import NumberInputClasses from "./cssModules/NumberInput.module.css"
import PaginationClasses from "./cssModules/Pagination.module.css"
import PasswordInputClasses from "./cssModules/PasswordInput.module.css"
import SelectClasses from "./cssModules/Select.module.css"
import TableClasses from "./cssModules/Table.module.css"
import TagsInputClasses from "./cssModules/TagsInput.module.css"
import TextareaClasses from "./cssModules/Textarea.module.css"
import TextInputClasses from "./cssModules/TextInput.module.css"
import { Z_INDEX_MANAGER } from "./zIndexManager"

export const theme = createTheme({
  colors: {
    primary: colors.main,
    secondary: colors.darkOrange,
    success: colors.darkGreen,
    "dark-blue": colors.darkBlue,
  },
  primaryColor: "primary",
  fontFamily: "var(--font-family)",
  components: {
    LoadingOverlay: LoadingOverlay.extend({
      defaultProps: {
        overlayProps: {
          radius: "sm",
          color: "#FFFFFF",
          backgroundOpacity: 0.5,
        },
        zIndex: Z_INDEX_MANAGER.LOADING_OVERLAY,
      },
    }),
    NavLink: NavLink.extend({
      classNames: NavLinkClasses,
    }),
    Table: Table.extend({
      classNames: TableClasses,
      defaultProps: {
        bg: "white",
      },
    }),
    Pagination: Pagination.extend({
      classNames: PaginationClasses,
    }),
    TextInput: TextInput.extend({
      classNames: TextInputClasses,
    }),
    PasswordInput: PasswordInput.extend({
      classNames: PasswordInputClasses,
    }),
    Button: Button.extend({
      classNames: ButtonClasses,
    }),
    Select: Select.extend({
      classNames: SelectClasses,
      defaultProps: {
        rightSection: <IconChevronDown stroke={2} size={24} />,
        styles: {
          dropdown: {
            zIndex: Z_INDEX_MANAGER.DROPDOWN,
          },
        },
      },
    }),
    MultiSelect: MultiSelect.extend({
      classNames: MultiSelectClasses,
      styles: {
        dropdown: {
          zIndex: Z_INDEX_MANAGER.DROPDOWN,
        },
      },
      defaultProps: {
        rightSection: <IconChevronDown stroke={2} size={24} />,
      },
    }),
    Textarea: Textarea.extend({
      classNames: TextareaClasses,
    }),
    DatePickerInput: DatePickerInput.extend({
      classNames: DatePickerInputClasses,
      defaultProps: {
        valueFormat: "DD/MM/BBBB",
        yearLabelFormat: "BBBB",
        yearsListFormat: "BBBB",
        decadeLabelFormat: "BBBB",
        monthLabelFormat: "MMMM BBBB",
        popoverProps: {
          withinPortal: true,
          zIndex: Z_INDEX_MANAGER.DROPDOWN,
        },
      },
    }),
    MonthPickerInput: MonthPickerInput.extend({
      classNames: MonthPickerInputClasses,
      defaultProps: {
        valueFormat: "MMMM BBBB",
        yearLabelFormat: "BBBB",
        yearsListFormat: "BBBB",
        decadeLabelFormat: "BBBB",
        popoverProps: {
          withinPortal: true,
          zIndex: Z_INDEX_MANAGER.DROPDOWN,
        },
      },
    }),
    Popover: Popover.extend({
      defaultProps: {
        styles: {
          dropdown: {
            zIndex: Z_INDEX_MANAGER.DROPDOWN,
          },
        },
      },
    }),
    Dropzone: Dropzone.extend({
      classNames: DropzoneClasses,
      defaultProps: {
        onReject: fileRejection => {
          for (const record of fileRejection) {
            for (const error of record.errors) {
              if (error.code === "file-invalid-type")
                NotificationUtil.notifyError({
                  title: "Invalid file type",
                })
              else if (error.code === "file-too-large")
                NotificationUtil.notifyError({
                  title: "File too large",
                })
              else
                NotificationUtil.notifyError({
                  title: "Error",
                })
              return
            }
          }
        },
        maxSize: 10485760, //10 MB
      },
    }),
    NumberInput: NumberInput.extend({
      classNames: NumberInputClasses,
      defaultProps: {
        hideControls: true,
        thousandSeparator: ",",
      },
    }),
    Autocomplete: Autocomplete.extend({
      classNames: AutocompleteClasses,
      defaultProps: {
        rightSection: <IconChevronDown stroke={2} size={24} />,
        styles: {
          dropdown: {
            zIndex: Z_INDEX_MANAGER.DROPDOWN,
          },
        },
      },
    }),
    Modal: Modal.extend({
      defaultProps: {
        zIndex: Z_INDEX_MANAGER.MODAL,
      },
    }),
    ActionIcon: ActionIcon.extend({
      classNames: ActionIconClasses,
    }),
    Tooltip: Tooltip.extend({
      defaultProps: {
        zIndex: Z_INDEX_MANAGER.TOOLTIP,
      },
    }),
    TagsInput: TagsInput.extend({
      classNames: TagsInputClasses,
      defaultProps: {
        styles: {
          dropdown: {
            zIndex: Z_INDEX_MANAGER.DROPDOWN,
          },
        },
      },
    }),
    Combobox: Combobox.extend({
      defaultProps: {
        styles: {
          dropdown: {
            zIndex: Z_INDEX_MANAGER.DROPDOWN,
          },
        },
      },
    }),
  },
})
