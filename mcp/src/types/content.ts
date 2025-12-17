export type ContentPart =
  | { text: string }
  | { functionCall: any }
  | { functionResponse: any };

export interface Content {
  role: "user" | "model";
  parts: ContentPart[];
}