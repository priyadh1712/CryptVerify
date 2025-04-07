const url =
  process.env.NODE_ENV == "production"
    ? "https://auth-wallet.vercel.app"
    : "http://localhost:3000";

export const handlePopup = async (
  requestType: string,
  responseType: string,
  messageData?: unknown,
) => {
  const width = 400;
  const height = 600;
  const left = window.screenX + (window.innerWidth - width) / 2;
  const top = window.screenY + (window.innerHeight - height) / 2;

  const popup = window.open(
    `${url}/${requestType}`,
    "_blank",
    `width=${width},height=${height},top=${top},left=${left}`,
  );

  if (!popup) {
    throw new Error("Popup blocked");
  }

  return new Promise((resolve, reject) => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== url) {
        return;
      }

      if (event.data && event.data.type === "ready" && messageData) {
        popup.postMessage({ type: requestType, ...messageData }, "*");
      } else if (
        event.data &&
        event.data.type == responseType &&
        event.data[responseType]
      ) {
        window.removeEventListener("message", handleMessage);
        resolve(event.data[responseType]);
        popup.close();
      }
    };

    window.addEventListener("message", handleMessage);

    const checkPopupClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkPopupClosed);
        window.removeEventListener("message", handleMessage);
        reject(new Error("Popup closed by user"));
      }
    }, 500);
  });
};
