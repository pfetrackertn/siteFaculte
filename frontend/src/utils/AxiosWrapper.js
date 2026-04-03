import axios from "axios";
import { baseApiURL } from "../baseUrl";
const axiosWrapper = axios.create({
  baseURL: baseApiURL(),
});

axiosWrapper.interceptors.response.use(
  (response) => response,
  (error) => {
    const authErrorMessages = [
      "Invalid or expired token",
      "Jeton invalide ou expire",
    ];

    if (
      authErrorMessages.includes(error.response?.data?.message) &&
      error.response?.data?.success === false &&
      error.response?.data?.data === null
    ) {
      localStorage.clear();
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default axiosWrapper;
