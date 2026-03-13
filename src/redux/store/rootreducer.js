import { combineReducers } from "@reduxjs/toolkit";
import dashboardReducer from "../slicer/dashboardSlice";

export const rootReducer = combineReducers({
     dashboard: dashboardReducer,
});

export default rootReducer;
