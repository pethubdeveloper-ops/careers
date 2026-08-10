/** Static images are resolved by the bundler, not the type system. */
declare module "*.png" {
  const asset: number;
  export default asset;
}
