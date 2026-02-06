import { createSlice } from "@reduxjs/toolkit";

const applicationSlice = createSlice({
    name:'application',
    initialState:{
        applicants:null,
    },
    reducers:{
        setAllApplicants:(state,action) => {
            // Log the incoming payload
            console.log('Setting applicants in Redux:', action.payload);
            // Ensure similarity scores are numbers
            if (action.payload?.applications) {
                action.payload.applications = action.payload.applications.map(app => ({
                    ...app,
                    similarity: parseFloat(app.similarity)
                }));
            }
            state.applicants = action.payload;
        }
    }
});
export const {setAllApplicants} = applicationSlice.actions;
export default applicationSlice.reducer;