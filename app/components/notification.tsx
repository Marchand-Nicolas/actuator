import { FC } from "react";
import styles from "../styles/components/Notification.module.css";

type NotificationProps = {
  message: string;
  icon: string;
};

const Notification: FC<NotificationProps> = ({ message, icon }) => {
  return (
    <div className={styles.notification}>
      <span className={styles.icon}>{icon}</span>
      <span>{message}</span>
    </div>
  );
};

export default Notification;
