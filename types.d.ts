declare module "bun" {
  interface Env {
    GITHUB_TOKEN: string;
    PAYLOAD: string
    SIGNATURE_HEADER: string
  }
}