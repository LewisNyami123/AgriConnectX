# -------------------------------
# Server Configuration
# -------------------------------
PORT=5000                 # Port your backend runs on (can be 3000, 4000, etc.)
NODE_ENV=development      # Use "development" locally, "production" when deployed

# -------------------------------
# Database (MongoDB Atlas)
# -------------------------------
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/agriconnectx?retryWrites=true&w=majority
# Replace <username> and <password> with your MongoDB Atlas credentials

# -------------------------------
# Authentication (JWT)
# -------------------------------
JWT_SECRET=agriconnectx_jwt_secret_key_for_cameroon_agriculture_platform
# Generate a long random string for security
JWT_EXPIRE=7d
# Token expiry (7 days is typical)

# -------------------------------
# Cloudinary (Image Hosting)
# -------------------------------
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
# Get these from your Cloudinary dashboard after signing up

# -------------------------------
# MTN Mobile Money API
# -------------------------------
MTN_MOMO_API_KEY=your_mtn_momo_api_key
MTN_MOMO_USER_ID=your_mtn_momo_user_id
MTN_MOMO_PRIMARY_KEY=your_mtn_momo_primary_key
# Register at MTN MoMo Developer Portal to get these keys

# -------------------------------
# Orange Money API
# -------------------------------
ORANGE_MONEY_API_KEY=your_orange_money_api_key
ORANGE_MONEY_SECRET=your_orange_money_secret
# Register at Orange Developer Portal to get these keys