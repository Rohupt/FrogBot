const mongoose = require('mongoose');

const CampSchema = mongoose.Schema({
    name: {type: String, required: true},
    isOS: {type: Boolean, required: true},
    DM: String,
    role: {type: String, required: true},
    state: {type: String, required: true},
    description: {type: String, default: ''},
    notes: {type: String, default: ''},
    roleplayChannel: String,
    discussChannel: String,
    players: Array
});

module.exports = mongoose.model('camps', CampSchema);