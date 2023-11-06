const Services = require('../service/zohoApi');
const Joi = require('joi'); 

module.exports = [
    {
        method: 'GET',
        path: '/get/zoho/approvedLeave/count',
        options: {
            description: 'Get zoho campus data',
            notes: 'Returns a message',
            tags: ['api'],
            validate:{
                query:Joi.object({
                campusID:Joi.string().required(),
                whichDate:Joi.string().required()
                })
            }, 
        },
        handler: async (request, h) => {
            try {
                const campusID = request.query.campusID; // Get campusID from the query parameters
                const whichDate = request.query.whichDate; // Get whichDate from the query parameters
                const leaveType = await Services.GetApprovedLeavesPerDay(campusID,whichDate);
                return h.response(leaveType);
            } catch (err) {
                return h.response({ error: err.message }).code(500)
            }
        },
    },

    {
        method: 'GET',
        path: '/get/zoho/approvedLeave/{id}',
        options: {
            description: 'Get zoho campus data',
            notes: 'Returns a message',
            tags: ['api'],
            validate:{
                params:Joi.object({
                  id:Joi.string().required()
                })
              },       
        },
        handler: async (request, h) => {
            try {
                // const data = await Services.zohoData();
                const response = await Services.AddApprovedLeavesToAllotedLeaves(request.params.id);
                return h.response(response);
            } catch (err) {
                return h.response({ error: err.message }).code(500)
            }
        },
    },

    {
        method: 'GET',
        path: '/get/zoho/students',
        options: {
            description: 'Get zoho campus data',
            notes: 'Returns a message',
            tags: ['api'],      
        },
        handler: async (request, h) => {
            try {
                // const data = await Services.zohoData();
                const response = await Services.getStudents();
                return h.response(response);
            } catch (err) {
                return h.response({ error: err.message }).code(500)
            }
        },
    }

]