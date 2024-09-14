import { FC, useEffect, useState } from "react";
import getRelativeTime from "../utils/getRelativeTime";

type RelativeTimeProps = {
  date: number;
};

const RelativeTime: FC<RelativeTimeProps> = ({ date }) => {
  const [string, setString] = useState<string>("");

  useEffect(() => {
    const refresh = () => setString(getRelativeTime(date));
    refresh();
    const interval = setInterval(refresh, 100);
    return () => clearInterval(interval);
  }, [date]);

  return string;
};

export default RelativeTime;
