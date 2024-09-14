import { Memory } from "../page";

export const ping = async (
  callback: (res: Memory) => void,
  token: string,
  isFirstLoad: boolean
) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/status?firstLoad=${isFirstLoad}`,
      {
        method: "GET",
        headers: {
          authorization: `Bearer ${token}`,
        },
      }
    );
    const data = await response.json();
    if (data.status === "ok") callback(data.memory);
  } catch (error) {
    console.error("Error:", error);
  }
};

export const open = async (token: string) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/open`, {
      method: "GET",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error("Error:", error);
  }
};
