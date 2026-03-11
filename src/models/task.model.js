
import mongoose, { Schema } from "mongoose";


const taskSchema = new Schema({
    title: {
    type: String,
    required: true,
    trim:true,
    maxlength:[200,"title must be less than 200 characters"]
  },
  description: {
    type: String,
    trim:true,
    maxlength:[2000,"description must be less than 2000 characters"]
  },
  project: {
    type: Schema.Types.ObjectId,
    ref: "Project",
    required: true,
    index: true,
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: "User",
    default:null
  },
  assignedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    
  },

  status: {
    type: String,
    enum: ["to-do", "in-progress", "done"],
    default: "to-do",
    index:true,
  },

  priority: {
    type: String,
    enum: ["low", "medium", "high","crictical"],
    default: "medium",
    index:true,
  },
  dueDate: {
    type: Date,
    default: null,
    index:true
  },
  estimatedHours: {
    type: Number,
    min:[0,"estimated hours must be greater than 0"],
    default: null,
    
  },
  actualHours: {
    type: Number,
    min:[0,"actual hours must be greater than 0"],
    default: null,
    
  },
  tags:[{
    type:String,
    trim:true,
    maxlength:[50,"tags must be less than 50 characters"],
    index:true
  }],

  attachments: [{
    filename: {
      type: String,
      trim:true,
      maxlength:[200,"filename must be less than 200 characters"],
      
    },
    path: {
      type: String,
      trim:true,
      maxlength:[500,"path must be less than 500 characters"],
      
    },
  }]

  

},{ timestamps: true });

export const tableTask = mongoose.model("task", taskSchema);

export default tableTask;