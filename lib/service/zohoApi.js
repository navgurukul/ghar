const axios = require("axios");
const _ = require("lodash");
const {
  zohoData,
  zohoDataForCopyOf,
  postZohoDataForCopyOf,
  getLearningPlatformData,
} = require("../helpers/zohotoken");
const { authenticateWithServiceAccount } = require("../helpers/spreadSheet");
class ZohoCalculation {
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
      for (const item of studentList) {
        for (const propertyName in item) {
          const ele = item[propertyName];
          if (
            propertyName === "Leave_Type" &&
            ele &&
            ele.Name !== "UnApproved Leave"
          ) {
            totalApprovedLeaves += 1;
          }
        }
      }
      return totalApprovedLeaves;
    } catch (error) {
      return error;
    }
  }

  async AddApprovedLeavesToAllotedLeaves(applyLeaveRowID) {
    try {
      const reportApplyLeave = "Apply_Leave_Report";
      const applyLeaveData = await zohoData(reportApplyLeave);

      // applyLeaveRowID = "163704000001896264"
      const applyLeaveDataById = applyLeaveData.data.filter((ele) => {
        return ele.ID === applyLeaveRowID;
      });
      const campusName = applyLeaveDataById[0].All_Campuses["Campus_Name"];
      const studentName = applyLeaveDataById[0].Student1.zc_display_value;
      const leaveTypeName = applyLeaveDataById[0].Leave_Type.zc_display_value;

      const oneDay = 24 * 60 * 60 * 1000; // One day in milliseconds
      const fromDay = new Date(applyLeaveDataById[0].From1);
      const ToDay = new Date(applyLeaveDataById[0].To);
      const daysOfleave = Math.abs(Math.round((ToDay - fromDay) / oneDay));

      // fetch data of allocated leaves
      const reportAllocatedLeaves = "Allocated_Leaves_Report";
      const allocatedLeaves = await zohoData(reportAllocatedLeaves);
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
        const leaveTypeDataById = leaveTypeData.data.filter((ele) => {
          return ele.ID === applyData.Leave_Type.ID;
        });
        leaveType.push(...leaveTypeDataById);
      }

      const currentMax = leaveType[0].Max_Days_year;
      let leaveAvailable = 0;
      if (currentMax != "") {
        leaveAvailable = currentMax - daysOfleave;
      } else {
        leaveAvailable = 0;
      }
      const response = {
        campusName,
        studentName,
        leaveTypeName,
        daysOfleave,
        leaveAvailable,
      };
      return response;
    } catch (error) {
      return error;
    }
  }

  async getStudents(min_value, max_value) {
    try {
      const params = {
        criteria:
          "Student_ID1 >=" + min_value + "&& Student_ID1 <=" + max_value,
        max_records: 1000,
      };
      const getStudents = "All_Students";
      const studentsData = await zohoData(getStudents, params);
      return studentsData;
    } catch (error) {
      return error;
    }
  }
  /* async updateStudentData(range, learningProviderName, isDev) {
    try {
      const newArrayeOfEmail = [];
      const getlearningPlatform = await getLearningPlatformData(
        "Learning_Provide_Type_Report",
        isDev
      );
      for (const platFormName of getlearningPlatform.data) {
        if (platFormName.Name == learningProviderName) {
          console.log(platFormName.ID, "name");
          const excelSheetData = await authenticateWithServiceAccount(range);
          for (const element of excelSheetData) {
            // If element[1] is undefined or an empty string, skip this iteration - not found Username
            if (element[1] == undefined || element[1] == "") {
              newArrayeOfEmail.push([
                element[0],
                `${learningProviderName} Username not found`,
              ]);
              continue;
            }
            let updateData = {
              criteria: "Navgurukul_Email == ghartech1@navgurukul.org",
              data: [
                {
                  Set_of_External_student_profiles: [
                    {
                      Learning_Provider_Type: platFormName.ID,
                      Username1: element[1],
                    },
                  ],
                },
              ],
            };

            // Specify the report name for Zoho data patching
            const reportName = "All_Students";
            try {
              const response = await patchZohoDataForCopyOf(
                reportName,
                updateData,
                isDev
              );
              console.log(response, "response");
            } catch (error) {
              // Handle the specific error here if user email is not found
              newArrayeOfEmail.push([
                element[0],
                "Email not found in the students report",
              ]);
            }
          }
        }
      }
      return { success: newArrayeOfEmail }; // Return success message
    } catch (error) {
      throw error; // Re-throw for proper handling
    }
  }*/

  async getData(min_value, max_value) {
    try {
      let params = {
        criteria: `Navgurukul_Email == sarika62@navgurukul.org && Student_ID1 >= ${min_value} && Student_ID1 <= ${max_value}`,
        max_records: 1000,
      };
      let reportName = "All_Students";
      const data = await zohoData(reportName, params);
      console.log(data, "data");
      return data;
    } catch (error) {
      throw error;
    }
  }

  //   async updateStudentData(
  //     range,
  //     learningProviderName,
  //     isDev,
  //     min_value,
  //     max_value
  //   ) {
  //     try {
  //       const emailUpdateStatus = [];
  //       const learningPlatformData = await getLearningPlatformData(
  //         "Learning_Provide_Type_Report",
  //         isDev
  //       );

  //       for (const platform of learningPlatformData.data) {
  //         if (platform.Name === learningProviderName) {
  //           const excelSheetData = await authenticateWithServiceAccount(range);

  //           for (const element of excelSheetData) {
  //             if (!element[1]) {
  //               emailUpdateStatus.push([
  //                 element[0],
  //                 `${learningProviderName} Username not found`,
  //               ]);
  //               continue;
  //             }

  //             const paramsToGetSystemId = {
  //               criteria: `Student_ID1 >= ${min_value} && Student_ID1 <= ${max_value}`,
  //               max_records: 1000,
  //             };
  //             const reportNameData = "All_Students";
  //             const getSystemId = await zohoData(
  //               reportNameData,
  //               paramsToGetSystemId
  //             );
  //             // console.log(getSystemId, "getSystemId");
  //             let foundData = getSystemId.data.find(
  //               (ele) => ele.Navgurukul_Email === element[0]
  //             );

  //             if (!foundData) {
  //               const updateData = {
  //                 data: [
  //                   {
  //                     Learning_Provider_Type: platform.ID,
  //                     user_name: element[1],
  //                     studentId: foundData.Student_ID1,
  //                   },
  //                 ],
  //               };
  //             try {
  //               const response = await patchZohoDataForCopyOf(
  //                 "add_Learning_provider_Details",
  //                 updateData,
  //                 isDev
  //               );
  //               // console.log(response.result, "response data");
  //             } catch (error) {
  //               console.error(error);
  //               emailUpdateStatus.push([
  //                 element[0],
  //                 "Email not found in the students report",
  //               ]);
  //             }
  //           }

  //           break; // Break out of loop after finding the matching platform
  //         }
  //       }

  //       return { success: emailUpdateStatus };
  //     } catch (error) {
  //       console.error(error);
  //       throw error;
  //     }
  //   }
  // }

  async updateStudentData(
    range,
    learningProviderName,
    isDev,
    min_value,
    max_value
  ) {
    try {
      const emailUpdateStatus = [];
      const learningPlatformData = await getLearningPlatformData(
        "All_Provider_Types",
        isDev
      );

      for (const platform of learningPlatformData.data) {
        if (platform.Name === learningProviderName) {
          const excelSheetData = await authenticateWithServiceAccount(range);

          for (const element of excelSheetData) {
            if (!element[1]) {
              emailUpdateStatus.push([
                element[0],
                `${learningProviderName} Username not found`,
              ]);
              continue;
            }

            let paramsToGetSystemId = {
              criteria: `Student_ID1 >= ${min_value} && Student_ID1 <= ${max_value}`,
              max_records: 1000,
            };
            let reportNameData = "Students_Report";
            let getSystemId = await zohoData(
              reportNameData,
              paramsToGetSystemId
            );
            // console.log(getSystemId, "getSystemId....315");
            // Use find instead of filter
            let foundData = getSystemId.data.filter((ele) => {
              return ele.Navgurukul_Email == element[0];
            });
            // console.log(foundData, "foundData...320");
            // console.log(foundData[0].ID, "foundData...321");
            if (foundData.length > 0) {
              const addData = {
                data: [
                  {
                    Learning_Provider_Type: platform.ID,
                    user_name: element[1],
                    Student_Id: foundData[0].ID,
                  },
                ],
              };

              try {
                const response = await postZohoDataForCopyOf(
                  "add_Learning_provider_Details",
                  addData,
                  isDev
                );
                // console.log(response.result, "response data");
              } catch (error) {
                console.error(error);
                emailUpdateStatus.push([
                  element[0],
                  "Email not found in the students student Id line 344...",
                ]);
              }
            } else {
              emailUpdateStatus.push([
                element[0],
                "Email not found in the students report",
              ]);
            }
          }
          break; // Break out of loop after finding the matching platform
        }
      }

      return { success: emailUpdateStatus };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getSheetData(range) {
    try {
      const response = await authenticateWithServiceAccount(range);
      return response;
    } catch (error) {
      return error;
    }
  }
}

module.exports = new ZohoCalculation();
