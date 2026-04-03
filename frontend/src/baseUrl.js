export const baseApiURL = () => {
  return process.env.REACT_APP_APILINK?.trim() || "http://localhost:4000/api";
};
