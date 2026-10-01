const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { 
    type: String, 
    enum: ['Laptop', 'Desktop', 'Monitor', 'Mobile Device', 'Access Card', 'Furniture', 'Other'],
    default: 'Laptop'
  },
  assetTag: { type: String, unique: true, required: true, trim: true },
  serialNumber: { type: String, default: '', trim: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  allocatedDate: { type: Date },
  returnDate: { type: Date },
  status: { 
    type: String, 
    enum: ['available', 'allocated', 'in_repair', 'retired'], 
    default: 'available' 
  },
  specifications: { type: String, default: '' },
  condition: { type: String, default: 'Good' },
  notes: { type: String, default: '' },
}, { timestamps: true });

assetSchema.index({ assignedTo: 1 });
assetSchema.index({ assetTag: 1 });
assetSchema.index({ status: 1 });

module.exports = mongoose.model('Asset', assetSchema);
