import { notifications } from "@mantine/notifications"
import classNames from "./CustomNotification.module.css"

type NotificationParams = {
  title?: string
  message?: string
  time?: number
}

export const NotificationUtil = {
  notifySuccess(
    { title, message, time }: NotificationParams = {
      title: "Success",
    }
  ) {
    notifications.show({
      title,
      message,
      color: "green",
      classNames,
      autoClose: time,
    })
  },
  notifyError({ title, message, time }: NotificationParams) {
    notifications.show({
      title,
      message,
      color: "red",
      classNames,
      autoClose: time,
    })
  },
}
