const mongoose = require("mongoose");

// Ek user (login karne wala). Password kabhi seedha save nahi hota, sirf uska bcrypt hash.
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    // lowercase aur unique: "A@x.com" aur "a@x.com" ek hi email maane jaayenge
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // select: false = queries mein ye field tab tak nahi aati jab tak .select("+passwordHash") na likho
    passwordHash: { type: String, required: true, select: false },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  { timestamps: true } // createdAt aur updatedAt apne aap bante hain
);

// Kisi bhi response (res.json) mein user jaaye to passwordHash aur __v hamesha hat jaayein
userSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("User", userSchema);
