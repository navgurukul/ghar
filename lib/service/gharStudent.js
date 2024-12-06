const { httpErrorFromResponse } = require("@slack/web-api/dist/errors");
const {
  zohoDataSTudent,
  zohoData,
  updateGhrStd,
  insertGhrStd,
} = require("../helpers/zohotoken");
const Boom = require("@hapi/boom");
const { keys } = require("lodash");

class gharStudents {
  async getStudentsByEmail(student_email, isDev) {
    try {
      // Define the criteria to search for the student
      const params = {
        criteria: `Navgurukul_Email == "${student_email}"`,
      };
      const getStudents = "Ghar_Student_Report";
      // Call the zohoDataSTudent function to fetch the student data
      const studentsData = await zohoDataSTudent(getStudents, params, isDev);
      if (!studentsData || !studentsData.data) {
        return `No student found with email ${student_email}`;
      }
      return studentsData;
    } catch (error) {
      console.error("Error fetching students:", error);
      return error;
    }
  }

  async getCampuses(isDev) {
    try {
      // Define the report name to fetch the campuses
      const getCampuses = "All_Campuses1";
      const campusesData = await zohoDataSTudent(getCampuses, {}, isDev);

      if (
        !campusesData ||
        !campusesData.data ||
        campusesData.data.length === 0
      ) {
        return "No campuses found";
      }

      // Return the campuses data
      return campusesData;
    } catch (error) {
      console.error("Error fetching campuses:", error);
      return error;
    }
  }

  async getSchoolsBasedOnCampus(campus, isDev) {
    try {
      // calling the getCampuses function from the service
      const campusData = await this.getCampuses(isDev);

      if (!campusData || !campusData.data) {
        throw new Error("No campus data found");
      }

      let campusId;
      for (let campusName of campusData.data) {
        if (campusName.Campus_Name == campus) {
          campusId = campusName.ID;
          break;
        }
      }

      if (!campusId) {
        throw new Error(`Campus ${campus} not found`);
      }

      const params = {
        criteria: `Campuses == ${campusId}`,
      };
      // Define the report name to fetch the schools
      const getSchools = "Assign_School_to_Campus_Report";
      const schoolsData = await zohoDataSTudent(getSchools, params, isDev);

      if (!schoolsData || !schoolsData.data) {
        throw new Error("No schools data found");
      }

      return schoolsData;
    } catch (error) {
      console.error("Error fetching schools:", error);
      return error;
    }
  }

  async updateGrFrmGrStd(recordId, upData, isDev) {
    try {
      // Define the update data with the fields to be updated
      const updateData = {
        data: [
          {
            Name: {
              first_name: upData["Name_first_name"],
              last_name: upData["Name_last_name"],
            },
            Mother_s_Name: {
              first_name: upData["Mother_s_Name_first_name"],
              last_name: upData["Mother_s_Name_last_name"],
            },
            Father_s_Name: {
              first_name: upData["Father_s_Name_first_name"],
              last_name: upData["Father_s_Name_last_name"],
            },
            Father_s_Phone_No: upData["Father_s_Phone_No"],
            Mother_s_Phone_No: upData["Mother_s_Phone_No"],
            Personal_Email: upData["Personal_Email"],
            Campus_Name: upData["Campus_Name"],
            Admission_Test_mode: upData["Admission_Test_mode"],
            Marital_status: upData["Marital_Status"],
            Date_of_Birth: upData["Date_of_Birth"],
            Phone_Number: upData["Phone_Number"],
            Admission_Test_Score: upData["Admission_Test_Score"],
            Gender: upData["Gender"],
            School_Name: upData["School_Name"],
            Aadhar_No: upData["Aadhar_No"],
            Discord_User_Id: upData["Discord_User_ID"],
            Status: upData["Status"],
            Qualification: upData["Qualification1"],
            Religion: upData["Religion"],
            Caste: upData["Caste"],
            Admission_Test_Email: upData["Admission_Test_Email"],
            Address: {
              address_line_1: upData["Address_address_line_1"],
              district_city: upData["Address_district_city"],
              state_province: upData["Address_state_province"],
              postal_Code: upData["Address_postal_Code"],
            },
            Update_Source: upData["Update_Source"],
            Last_Updated: upData["Last_Updated"],
          },
        ],
      };
      let errors, key;
      let responseData;
      // Define the report name to update the student details
      const reportName = "Ghar_Student_Report";
      responseData = await updateGhrStd(
        reportName,
        updateData,
        recordId,
        isDev
      );
      if (responseData.error) {
        errors = Object.values(responseData.error)[0];
        key = Object.keys(responseData.error)[0];
        return Boom.badRequest(`${key}: ${errors}`);
      }
      return responseData;
    } catch (error) {
      console.error("Error in insertGrFrmGrStd:", error);
      return Boom.badRequest(error);
    }
  }

  async insertGrFrmGrStd(ele, isDev) {
    // calling the getCampuses function from the service
    const campusData = await this.getCampuses(isDev);
    const campus = campusData.data.find(
      (item) => item.Campus_Name === ele.Campus_Name
    );
    if (!campus) {
      throw new Error(`Campus with name ${ele.Campus_Name} not found`);
    }
    const campusId = campus.ID;
    // Define the payload to insert the student data
    let payload = {
      data: [
        {
          Navgurukul_Email: ele.Navgurukul_Email,
          Personal_Email: ele.Personal_Email,
          Gender: ele.Gender,
          Name: {
            first_name: ele.Name_first_name,
            last_name: ele.Name_last_name,
          },
          Select_Campus: campusId,
          Select_School1: ele.School_Name,
          Admission_Test_mode: ele.Admission_Test_mode,
          Marital_status: ele.Marital_status,
          Status: ele.Status,
          Joining_Date: ele.Joining_Date,
          Religion: ele.Religion,
          Qualification: ele.Qualification,
          Caste: ele.Caste,
          Admission_Test_Email: ele.Admission_Test_Email,
          Discord_User_Id: ele.Discord_User_Id,
          Admission_Test_Score: ele.Admission_Test_Score,
          Date_of_Birth: ele.Date_of_Birth,
          Phone_Number: ele.Phone_Number,
          Emergency_Phone: ele.Emergency_Phone,
          Aadhar_No: ele.Aadhar_No,
          Father_s_Phone: ele.Father_s_Phone,
          Mother_s_Phone: ele.Mother_s_Phone,
          Father_s_Name: {
            first_name: ele.Father_Name_first_name,
            last_name: ele.Father_Name_last_name,
          },
          Mother_s_Name: {
            first_name: ele.Mother_Name_first_name,
            last_name: ele.Mother_Name_last_name,
          },
          Address: {
            address_line_1: ele.Address_address_line_1,
            district_city: ele.Address_district_city,
            state_province: ele.Address_state_province,
            postal_Code: ele.Address_postal_Code,
          },
          Upload_Marksheets: ele.Upload_Marksheets.map((marksheet) => ({
            Level: marksheet.Level,
            Status: marksheet.Status,
            Year_field: marksheet.Year_field,
            Percentage: marksheet.Percentage,
            Stream: marksheet.Stream,
            Upload: marksheet.Upload,
          })),
          Update_Source: ele.Update_Source,
          User_Creation_Timestamp: ele.User_Creation_Timestamp,
        },
      ],
    };
    // Remove fields from payload if they are not present in ele
    const studentData = payload.data[0];
    for (const key in studentData) {
      if (typeof studentData[key] === "object" && studentData[key] !== null) {
        for (const subKey in studentData[key]) {
          if (studentData[key][subKey] === undefined) {
            delete studentData[key][subKey];
          }
        }
        if (Object.keys(studentData[key]).length === 0) {
          delete studentData[key];
        }
      } else if (studentData[key] === undefined) {
        delete studentData[key];
      }
    }

    let errors, key;
    let responseData;
    try {
      // Define the form name to insert the student data
      responseData = await insertGhrStd("Add_Student", payload, isDev);
      if (responseData.error) {
        errors = Object.values(responseData.error)[0];
        key = Object.keys(responseData.error)[0];
        return Boom.badRequest(`${key}: ${errors}`);
      }
      return responseData;
    } catch (error) {
      console.error("Error in insertGrFrmGrStd:", error);
      return Boom.badRequest(error);
    }
  }

  async getAttendanceConfigurationValue(isDev) {
    try {
      // get the report name from where will get the config value
      const reportName = "All_Attendance_Configurations";
      const getAttendanceConfigValue = await zohoDataSTudent(
        reportName,
        {},
        isDev
      );

      if (!getAttendanceConfigValue) {
        return "No attendance configuration value returned.";
      }
      return getAttendanceConfigValue;
    } catch (error) {
      console.error("Error fetching campuses:", error);
      return error;
    }
  }
}

module.exports = new gharStudents();
