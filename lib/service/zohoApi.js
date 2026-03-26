const { zohoData, zohoDataSTudent } = require("../helpers/zohotoken");

class ZohoCalculation {
  async getStudents(min_value, max_value) {
    try {
      const initialParams = {
        criteria: "Student_ID1 != null",
      };
      const getStudentsReport = "All_Students";
      const stdData = await zohoData(getStudentsReport, initialParams);

      if (stdData.data && stdData.data.length > 0) {
        // Sort the data by Student_ID1 in ascending order
        stdData.data.sort((a, b) => a.Student_ID1 - b.Student_ID1);

        // Get the last student ID
        const lastStudentID = stdData.data[stdData.data.length - 1].Student_ID1;

        // Fetch students within the specified range
        const rangeParams = {
          criteria:
            "Student_ID1 >=" + min_value + "&& Student_ID1 <=" + max_value,
          max_records: 1000,
        };
        const getStudents = "All_Students";
        const studentsData = await zohoData(getStudents, rangeParams);
        return { Count: lastStudentID, Data: studentsData.data };
      } else {
        return null; // No students found
      }
    } catch (error) {
      return { error: "An error occurred while fetching student data." };
    }
  }



  // Get filtered students  - Campus,school,status,studentID range
  async getFilteredStudents(filters, isDev) {
    try {
      const { campus, school, status, idStart, idEnd } = filters;
      const startTime = Date.now();

      // Build filter criteria
      const criteria = [];

      if (campus)
        criteria.push(`Select_Campus.Campus_Name == "${campus.trim()}"`);
      if (school) criteria.push(`Select_School1 == "${school.trim()}"`);
      if (status) criteria.push(`Status == "${status.trim()}"`);
      if (idStart) criteria.push(`Student_ID1 >= ${idStart}`);
      if (idEnd) criteria.push(`Student_ID1 <= ${idEnd}`);

      // Build Zoho params
      const params = {
        max_records: 1000,
        ...(criteria.length > 0 && { criteria: criteria.join(" && ") }),
      };

      // Fetch students
      const response = await zohoDataSTudent(
        "Ghar_Student_Report",
        params,
        isDev
      );
      const queryTime = Date.now() - startTime;

      const students = response?.data || [];

      // If no data found
      if (students.length === 0) {
        console.log(`No students found in ${queryTime}ms`);

        return {
          filters: {
            campus: campus || "all",
            school: school || "all",
            status: status || "all",
            studentIdRange:
              idStart || idEnd
                ? `${idStart || "min"} - ${idEnd || "max"}`
                : "all",
          },
          students: [],
          totalStudents: 0,
          appliedCriteria: params.criteria || "all students",
          queryTime: `${queryTime}ms`,
        };
      }

      // Sort by Student_ID1
      if (students[0]?.Student_ID1 !== undefined) {
        students.sort((a, b) => a.Student_ID1 - b.Student_ID1);
      }

      // Final response
      return {
        filters: {
          campus: campus || "all",
          school: school || "all",
          status: status || "all",
          requestedIdRange:
            idStart || idEnd
              ? `${idStart || "min"} - ${idEnd || "max"}`
              : "all",
        },
        students,
        totalStudents: students.length,
        appliedCriteria: params.criteria || "all students",
        queryTime: `${queryTime}ms`,
      };
    } catch (error) {
      console.error("Error:", error.message);
      throw error;
    }
  }

  async getOfferResponseAndPlacementByEmail(emailListString, isDev) {
    try {
      const reportName = "Offer_Response_and_Placement_Report";
      const requestedEmails = new Set(
        String(emailListString || "")
          .split(/[\n,;]+/)
          .map((email) => email.trim().toLowerCase())
          .filter((email) => email && email.endsWith("@navgurukul.org"))
      );

      if (!requestedEmails.size) {
        return {
          totalRecords: 0,
          data: [],
        };
      }

      const collectStringValues = (value, accumulator) => {
        if (typeof value === "string") {
          accumulator.push(value.trim().toLowerCase());
          return;
        }

        if (Array.isArray(value)) {
          for (const item of value) {
            collectStringValues(item, accumulator);
          }
          return;
        }

        if (value && typeof value === "object") {
          for (const nestedValue of Object.values(value)) {
            collectStringValues(nestedValue, accumulator);
          }
        }
      };

      const response = await zohoDataSTudent(reportName, { max_records: 1000 }, isDev);
      const rows = response?.data || [];

      const filteredRows = rows.filter((row) => {
        const values = [];
        collectStringValues(row, values);

        for (const rowValue of values) {
          for (const email of requestedEmails) {
            if (rowValue === email || rowValue.includes(email)) {
              return true;
            }
          }
        }

        return false;
      });

      return {
        totalRecords: filteredRows.length,
        data: filteredRows,
      };

    } catch (error) {
      console.error("Error fetching Offer Response and Placement report:", error.message);
      throw error;
    }
  }
}

module.exports = new ZohoCalculation();
