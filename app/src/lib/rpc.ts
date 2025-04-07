export async function request(method: string, params: any) {
  const res = await fetch(
    "https://base-sepolia.g.alchemy.com/v2/vzXI1-6dtYrvErKC7Q_KeiFLodiTojGg",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: 1,
        jsonrpc: "2.0",
        method,
        params,
      }),
    },
  );
  return await res.json();
}
