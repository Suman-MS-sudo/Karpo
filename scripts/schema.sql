-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "logo" TEXT,
    "city" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" DATETIME,
    "image" TEXT,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "phone" TEXT,
    "city" TEXT,
    "department" TEXT,
    "jobTitle" TEXT,
    "reputationScore" INTEGER NOT NULL DEFAULT 0,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "hiddenServices" TEXT NOT NULL DEFAULT '[]',
    "socialLinks" TEXT,
    "skills" TEXT NOT NULL DEFAULT '[]',
    "yearsOfExp" INTEGER,
    "username" TEXT,
    "companyId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'FREE',
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" DATETIME,
    "razorpaySubId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'GENERAL',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "listingId" TEXT,
    "listingType" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reviewerId" TEXT NOT NULL,
    "revieweeId" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Review_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_revieweeId_fkey" FOREIGN KEY ("revieweeId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CompanyRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "city" TEXT,
    "requestedBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "IdVerificationRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "corpEmail" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "employeeId" TEXT,
    "designation" TEXT,
    "frontImageUrl" TEXT NOT NULL,
    "backImageUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "IdVerificationRequest_corpEmail_key" ON "IdVerificationRequest"("corpEmail");

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "condition" TEXT NOT NULL DEFAULT 'USED',
    "isNegotiable" BOOLEAN NOT NULL DEFAULT true,
    "images" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "city" TEXT NOT NULL,
    "isBoosted" BOOLEAN NOT NULL DEFAULT false,
    "boostLevel" TEXT NOT NULL DEFAULT 'NONE',
    "boostExpiresAt" DATETIME,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "latitude" REAL,
    "longitude" REAL,
    "area" TEXT,
    "brand" TEXT,
    "purchaseYear" INTEGER,
    "warranty" TEXT,
    "meetingPref" TEXT NOT NULL DEFAULT 'BOTH',
    "phone" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Listing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ListingReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ListingReport_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ListingReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ListingOffer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listingId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ListingOffer_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ListingOffer_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ListingEngagement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'INTEREST',
    "visitDate" DATETIME,
    "visitTime" TEXT,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ListingEngagement_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ListingEngagement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RentalPost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "rent" INTEGER NOT NULL,
    "deposit" INTEGER,
    "city" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "amenities" TEXT NOT NULL DEFAULT '[]',
    "images" TEXT NOT NULL DEFAULT '[]',
    "availableFrom" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "description" TEXT,
    "bhk" TEXT,
    "furnished" TEXT NOT NULL DEFAULT 'UNFURNISHED',
    "floor" INTEGER,
    "totalFloors" INTEGER,
    "bathrooms" INTEGER DEFAULT 1,
    "gender" TEXT NOT NULL DEFAULT 'ANY',
    "occupancy" TEXT NOT NULL DEFAULT 'SINGLE',
    "petsAllowed" BOOLEAN NOT NULL DEFAULT false,
    "phone" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "isBoosted" BOOLEAN NOT NULL DEFAULT false,
    "societyName" TEXT,
    "landmark" TEXT,
    "fullAddress" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "carpetArea" INTEGER,
    "balconies" INTEGER NOT NULL DEFAULT 0,
    "propertyAge" TEXT,
    "facing" TEXT,
    "twoWheelerParking" TEXT NOT NULL DEFAULT 'NONE',
    "fourWheelerParking" TEXT NOT NULL DEFAULT 'NONE',
    "visitorParking" BOOLEAN NOT NULL DEFAULT false,
    "waterSupply" TEXT NOT NULL DEFAULT '24_7',
    "powerBackup" TEXT NOT NULL DEFAULT 'NONE',
    "gasType" TEXT NOT NULL DEFAULT 'NONE',
    "internet" TEXT NOT NULL DEFAULT 'NOT_INCLUDED',
    "maintenanceAmt" INTEGER,
    "maintenanceIncluded" BOOLEAN NOT NULL DEFAULT false,
    "brokerage" TEXT NOT NULL DEFAULT 'NONE',
    "workingProfOnly" BOOLEAN NOT NULL DEFAULT false,
    "studentsAllowed" BOOLEAN NOT NULL DEFAULT true,
    "couplesAllowed" BOOLEAN NOT NULL DEFAULT false,
    "familiesAllowed" BOOLEAN NOT NULL DEFAULT true,
    "smokingAllowed" BOOLEAN NOT NULL DEFAULT false,
    "alcoholAllowed" BOOLEAN NOT NULL DEFAULT false,
    "vegetarianOnly" BOOLEAN NOT NULL DEFAULT false,
    "visitorsAllowed" BOOLEAN NOT NULL DEFAULT true,
    "nonVegAllowed" BOOLEAN NOT NULL DEFAULT true,
    "furnishingItems" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RentalPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RentalInquiry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rentalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'INQUIRY',
    "message" TEXT,
    "moveInDate" DATETIME,
    "visitDate" DATETIME,
    "visitTime" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RentalInquiry_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "RentalPost" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RentalInquiry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JobReferral" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "experienceMin" INTEGER NOT NULL,
    "experienceMax" INTEGER NOT NULL,
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "skills" TEXT NOT NULL DEFAULT '[]',
    "jobType" TEXT,
    "workMode" TEXT,
    "location" TEXT,
    "openings" INTEGER NOT NULL DEFAULT 1,
    "perks" TEXT NOT NULL DEFAULT '[]',
    "interviewProcess" TEXT,
    "internalCode" TEXT,
    "referralBonus" INTEGER,
    "deadline" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "isBoosted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "JobReferral_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "JobReferral_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReferralApplication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "referralId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'INTEREST',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "coverLetter" TEXT,
    "linkedIn" TEXT,
    "resumeUrl" TEXT,
    "yearsExp" INTEGER,
    "currentCompany" TEXT,
    "currentCtc" INTEGER,
    "expectedCtc" INTEGER,
    "noticePeriod" INTEGER,
    "referrerNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReferralApplication_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "JobReferral" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReferralApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CarpoolRoute" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fromLocation" TEXT NOT NULL,
    "fromLat" REAL,
    "fromLng" REAL,
    "toLocation" TEXT NOT NULL,
    "toLat" REAL,
    "toLng" REAL,
    "stopCoords" TEXT,
    "departureTime" TEXT NOT NULL,
    "returnTrip" BOOLEAN NOT NULL DEFAULT false,
    "returnTime" TEXT,
    "seatsAvailable" INTEGER NOT NULL,
    "pricePerSeat" INTEGER NOT NULL,
    "monthlyPassAvailable" BOOLEAN NOT NULL DEFAULT false,
    "monthlyPassPrice" INTEGER,
    "frequency" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "vehicleNumber" TEXT,
    "acAvailable" BOOLEAN NOT NULL DEFAULT true,
    "pickupPoints" TEXT NOT NULL DEFAULT '[]',
    "landmarks" TEXT,
    "allowedGender" TEXT,
    "musicPolicy" TEXT,
    "luggagePolicy" TEXT,
    "notes" TEXT,
    "vehicleModel" TEXT,
    "vehicleColor" TEXT,
    "vehiclePhoto" TEXT,
    "rideStatus" TEXT NOT NULL DEFAULT 'IDLE',
    "liveTrackLat" REAL,
    "liveTrackLng" REAL,
    "liveTrackAt" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isBoosted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CarpoolRoute_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CarpoolRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "routeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pickupPoint" TEXT,
    "pickupLat" REAL,
    "pickupLng" REAL,
    "dropoffPoint" TEXT,
    "dropoffLat" REAL,
    "dropoffLng" REAL,
    "seatsNeeded" INTEGER NOT NULL DEFAULT 1,
    "paymentMode" TEXT,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CarpoolRequest_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "CarpoolRoute" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CarpoolRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ServicePost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priceType" TEXT NOT NULL,
    "price" INTEGER,
    "portfolio" TEXT NOT NULL DEFAULT '[]',
    "city" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ServicePost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "merchantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "discount" INTEGER NOT NULL,
    "code" TEXT,
    "validUntil" DATETIME NOT NULL,
    "category" TEXT NOT NULL,
    "images" TEXT NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "merchantName" TEXT NOT NULL DEFAULT '',
    "merchantUrl" TEXT,
    "terms" TEXT,
    "redemptionSteps" TEXT,
    "website" TEXT,
    "usageLimit" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "location" TEXT NOT NULL,
    "maxParticipants" INTEGER,
    "fee" INTEGER NOT NULL DEFAULT 0,
    "images" TEXT NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "agenda" TEXT,
    "onlineLink" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "isBoosted" BOOLEAN NOT NULL DEFAULT false,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Event_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EventRsvp" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventRsvp_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventRsvp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "instructorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "duration" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "schedule" TEXT NOT NULL,
    "images" TEXT NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "level" TEXT NOT NULL DEFAULT 'BEGINNER',
    "tags" TEXT NOT NULL DEFAULT '[]',
    "prerequisites" TEXT,
    "maxStudents" INTEGER,
    "curriculum" TEXT,
    "certificate" BOOLEAN NOT NULL DEFAULT false,
    "language" TEXT NOT NULL DEFAULT 'English',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Course_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConciergeLead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "assignedProId" TEXT,
    "notes" TEXT,
    "budget" INTEGER,
    "urgency" TEXT NOT NULL DEFAULT 'NORMAL',
    "timeline" TEXT,
    "phone" TEXT,
    "preferredContact" TEXT NOT NULL DEFAULT 'EMAIL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ConciergeLead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SkillListing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "tagline" TEXT,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "skills" TEXT NOT NULL DEFAULT '[]',
    "description" TEXT NOT NULL,
    "deliverables" TEXT NOT NULL DEFAULT '[]',
    "requirements" TEXT,
    "faqs" TEXT,
    "pricingModel" TEXT NOT NULL DEFAULT 'PACKAGE',
    "hourlyRate" INTEGER,
    "packages" TEXT,
    "format" TEXT NOT NULL DEFAULT 'ONLINE',
    "location" TEXT,
    "timezone" TEXT DEFAULT 'Asia/Kolkata',
    "availability" TEXT,
    "maxClientsPerMonth" INTEGER,
    "yearsExp" INTEGER,
    "certifications" TEXT NOT NULL DEFAULT '[]',
    "portfolioUrl" TEXT,
    "linkedIn" TEXT,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "completedOrders" INTEGER NOT NULL DEFAULT 0,
    "avgRating" REAL,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "responseTimeMins" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SkillListing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SkillOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listingId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "packageName" TEXT,
    "packageIdx" INTEGER,
    "agreedPrice" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'INQUIRY',
    "requirements" TEXT,
    "attachments" TEXT NOT NULL DEFAULT '[]',
    "buyerNote" TEXT,
    "counterPrice" INTEGER,
    "sessionDate" DATETIME,
    "sessionTime" TEXT,
    "meetLink" TEXT,
    "paymentMode" TEXT,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "invoiceId" TEXT,
    "deliveryNote" TEXT,
    "deliverables" TEXT NOT NULL DEFAULT '[]',
    "deliveredAt" DATETIME,
    "completedAt" DATETIME,
    "cancelledAt" DATETIME,
    "cancelReason" TEXT,
    "disputeReason" TEXT,
    "disputeNote" TEXT,
    "disputeOpenedAt" DATETIME,
    "resolvedAt" DATETIME,
    "resolutionNote" TEXT,
    "sellerNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SkillOrder_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "SkillListing" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SkillOrder_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SkillOrder_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SkillReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listingId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "ratingQuality" INTEGER,
    "ratingComm" INTEGER,
    "ratingPunctual" INTEGER,
    "headline" TEXT,
    "body" TEXT,
    "wouldRepeat" BOOLEAN NOT NULL DEFAULT true,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "sellerReply" TEXT,
    "repliedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SkillReview_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "SkillListing" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SkillReview_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "SkillOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SkillReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SkillReview_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BenefitProduct" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "minAmount" INTEGER,
    "maxAmount" INTEGER,
    "contactUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "features" TEXT NOT NULL DEFAULT '[]',
    "eligibility" TEXT,
    "interestRate" TEXT,
    "tenure" TEXT,
    "applicationSteps" TEXT NOT NULL DEFAULT '[]',
    "processingTime" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BenefitProduct_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CourseEnrollment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ENROLLED',
    "enrolledAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "CourseEnrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CourseEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DealRedemption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dealId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "redeemedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DealRedemption_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Company_domain_key" ON "Company"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_userId_key" ON "Membership"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Message_senderId_receiverId_idx" ON "Message"("senderId", "receiverId");

-- CreateIndex
CREATE INDEX "Message_receiverId_isRead_idx" ON "Message"("receiverId", "isRead");

-- CreateIndex
CREATE UNIQUE INDEX "Review_reviewerId_revieweeId_serviceType_key" ON "Review"("reviewerId", "revieweeId", "serviceType");

-- CreateIndex
CREATE INDEX "Listing_city_status_category_idx" ON "Listing"("city", "status", "category");

-- CreateIndex
CREATE INDEX "Listing_userId_idx" ON "Listing"("userId");

-- CreateIndex
CREATE INDEX "ListingReport_status_idx" ON "ListingReport"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ListingReport_listingId_userId_key" ON "ListingReport"("listingId", "userId");

-- CreateIndex
CREATE INDEX "ListingOffer_listingId_idx" ON "ListingOffer"("listingId");

-- CreateIndex
CREATE INDEX "ListingOffer_buyerId_idx" ON "ListingOffer"("buyerId");

-- CreateIndex
CREATE UNIQUE INDEX "ListingOffer_listingId_buyerId_key" ON "ListingOffer"("listingId", "buyerId");

-- CreateIndex
CREATE INDEX "ListingEngagement_listingId_idx" ON "ListingEngagement"("listingId");

-- CreateIndex
CREATE INDEX "ListingEngagement_userId_idx" ON "ListingEngagement"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ListingEngagement_listingId_userId_key" ON "ListingEngagement"("listingId", "userId");

-- CreateIndex
CREATE INDEX "RentalPost_city_status_type_idx" ON "RentalPost"("city", "status", "type");

-- CreateIndex
CREATE INDEX "RentalPost_userId_idx" ON "RentalPost"("userId");

-- CreateIndex
CREATE INDEX "RentalInquiry_rentalId_idx" ON "RentalInquiry"("rentalId");

-- CreateIndex
CREATE INDEX "RentalInquiry_userId_idx" ON "RentalInquiry"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RentalInquiry_rentalId_userId_key" ON "RentalInquiry"("rentalId", "userId");

-- CreateIndex
CREATE INDEX "JobReferral_status_department_idx" ON "JobReferral"("status", "department");

-- CreateIndex
CREATE INDEX "ReferralApplication_referralId_idx" ON "ReferralApplication"("referralId");

-- CreateIndex
CREATE INDEX "ReferralApplication_userId_idx" ON "ReferralApplication"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralApplication_referralId_userId_key" ON "ReferralApplication"("referralId", "userId");

-- CreateIndex
CREATE INDEX "CarpoolRoute_fromLocation_toLocation_idx" ON "CarpoolRoute"("fromLocation", "toLocation");

-- CreateIndex
CREATE INDEX "CarpoolRequest_routeId_idx" ON "CarpoolRequest"("routeId");

-- CreateIndex
CREATE INDEX "CarpoolRequest_userId_idx" ON "CarpoolRequest"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CarpoolRequest_routeId_userId_key" ON "CarpoolRequest"("routeId", "userId");

-- CreateIndex
CREATE INDEX "ServicePost_category_isActive_idx" ON "ServicePost"("category", "isActive");

-- CreateIndex
CREATE INDEX "Deal_isActive_validUntil_idx" ON "Deal"("isActive", "validUntil");

-- CreateIndex
CREATE INDEX "Event_date_isActive_category_idx" ON "Event"("date", "isActive", "category");

-- CreateIndex
CREATE UNIQUE INDEX "EventRsvp_eventId_userId_key" ON "EventRsvp"("eventId", "userId");

-- CreateIndex
CREATE INDEX "Course_isActive_category_idx" ON "Course"("isActive", "category");

-- CreateIndex
CREATE INDEX "ConciergeLead_status_serviceType_idx" ON "ConciergeLead"("status", "serviceType");

-- CreateIndex
CREATE INDEX "ConciergeLead_userId_idx" ON "ConciergeLead"("userId");

-- CreateIndex
CREATE INDEX "SkillListing_category_status_idx" ON "SkillListing"("category", "status");

-- CreateIndex
CREATE INDEX "SkillListing_userId_idx" ON "SkillListing"("userId");

-- CreateIndex
CREATE INDEX "SkillOrder_listingId_idx" ON "SkillOrder"("listingId");

-- CreateIndex
CREATE INDEX "SkillOrder_buyerId_idx" ON "SkillOrder"("buyerId");

-- CreateIndex
CREATE INDEX "SkillOrder_sellerId_idx" ON "SkillOrder"("sellerId");

-- CreateIndex
CREATE INDEX "SkillOrder_status_idx" ON "SkillOrder"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SkillReview_orderId_key" ON "SkillReview"("orderId");

-- CreateIndex
CREATE INDEX "SkillReview_listingId_idx" ON "SkillReview"("listingId");

-- CreateIndex
CREATE INDEX "SkillReview_sellerId_idx" ON "SkillReview"("sellerId");

-- CreateIndex
CREATE INDEX "BenefitProduct_type_isActive_idx" ON "BenefitProduct"("type", "isActive");

-- CreateIndex
CREATE INDEX "CourseEnrollment_courseId_idx" ON "CourseEnrollment"("courseId");

-- CreateIndex
CREATE INDEX "CourseEnrollment_userId_idx" ON "CourseEnrollment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseEnrollment_courseId_userId_key" ON "CourseEnrollment"("courseId", "userId");

-- CreateIndex
CREATE INDEX "DealRedemption_dealId_idx" ON "DealRedemption"("dealId");

-- CreateIndex
CREATE INDEX "DealRedemption_userId_idx" ON "DealRedemption"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DealRedemption_dealId_userId_key" ON "DealRedemption"("dealId", "userId");

