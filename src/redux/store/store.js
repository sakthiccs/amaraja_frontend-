import { configureStore } from "@reduxjs/toolkit";
import { rootReducer } from "../store/rootreducer";

const store = configureStore({
  reducer: {
    reducer: rootReducer,
  },
});
export default store;
