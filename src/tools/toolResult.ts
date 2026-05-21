export function toolSuccess<T>(summary: string, data: T) {
  return {
    content: [
      {
        type: "text" as const,
        text: `${summary}\n\n${JSON.stringify(data, null, 2)}`
      }
    ],
    structuredContent: data
  };
}
