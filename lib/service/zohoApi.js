const axios = require('axios');
const _ = require('lodash');
const {zohoData} = require('../halpers/zohotoken') 
class ZohoCalculation{
    async GetApprovedLeavesPerDay(campusID, whichDate) {
        try {
            // Define studentData
            const reportNameStudent = "Approve_Leaves";
            const studentData = await zohoData(reportNameStudent);

            // campusID = "163704000001257151";
            // whichDate = "17-Oct-2023";
            const studentList = studentData.data.filter((entry) => {
                return (
                    entry.Status === "Approve" &&
                    entry.All_Campuses.ID === campusID &&
                    entry.From1 <= whichDate &&
                    entry.To >= whichDate
                );
            });
            
            let totalApprovedLeaves = 0;
            for( const item of  studentList){
                for (const propertyName in item) {
                    const ele = item[propertyName];
                    if (propertyName === 'Leave_Type' && ele && ele.Name !== "UnApproved Leave") {
                      totalApprovedLeaves+=1;
                    }
                }
            }
            return totalApprovedLeaves;
        } catch (error) {
            return error;
        }
    }

    async AddApprovedLeavesToAllotedLeaves(applyLeaveRowID){
        try {
                const reportApplyLeave = "Apply_Leave_Report"
                const applyLeaveData = await zohoData(reportApplyLeave)

                // applyLeaveRowID = "163704000001896264"
                const applyLeaveDataById = applyLeaveData.data.filter((ele)=>{
                    return(
                        ele.ID === applyLeaveRowID
                    );
                })
                const campusName = applyLeaveDataById[0].All_Campuses["Campus_Name"]
                const studentName = applyLeaveDataById[0].Student1.zc_display_value
                const leaveTypeName = applyLeaveDataById[0].Leave_Type.zc_display_value
                
                const oneDay = 24 * 60 * 60 * 1000; // One day in milliseconds
                const fromDay = new Date(applyLeaveDataById[0].From1)
                const ToDay = new Date(applyLeaveDataById[0].To)
                const daysOfleave = Math.abs(Math.round((ToDay - fromDay) / oneDay));

                // fetch data of allocated leaves 
                const reportAllocatedLeaves = "Allocated_Leaves_Report"
                const allocatedLeaves = await zohoData(reportAllocatedLeaves)
                const allocatedLeavesData = [];

                for (const applyData of applyLeaveDataById) {
                    const filteredData = allocatedLeaves.data.filter((ele) => {
                        return (
                            ele.Student_Name.ID === applyData.Student1.ID &&
                            ele.Leave_Type.ID === applyData.Leave_Type.ID
                        );
                    });

                    allocatedLeavesData.push(...filteredData);
                }
                

                const reportLeaveType = "All_Leave_Types";
                const leaveTypeData = await zohoData(reportLeaveType);
                
                const leaveType = [];
                for (const applyData of applyLeaveDataById) {
                    const leaveTypeDataById = leaveTypeData.data.filter((ele)=>{
                        return(
                            ele.ID === applyData.Leave_Type.ID
                        );
                    })
                    leaveType.push(...leaveTypeDataById);
                }
                
                const currentMax = leaveType[0].Max_Days_year;
                let leaveAvailable = 0;
                if(currentMax != '')
                {
                    leaveAvailable = currentMax - daysOfleave;
                }
                else
                {
                    leaveAvailable = 0;
                }
               const response = {
                campusName,
                studentName,
                leaveTypeName,
                daysOfleave,
                leaveAvailable
               }
               return response;
        } catch (error) {
           return error; 
        }
    }
}

module.exports = new ZohoCalculation();


