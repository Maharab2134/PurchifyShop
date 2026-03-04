✅ **USER PROFILE PHONE NUMBER + CHECKOUT IMPROVEMENTS**

## Summary of Changes

### Backend Updates

#### 1. Database Migration
- **File**: `backend/database/migrations/2026_01_25_120000_add_phone_to_users_and_orders_table.php`
- Added `phone` field to `users` table (nullable, max 50 chars)
- Added `contact_phone` field to `orders` table (nullable, max 50 chars)
- Migration executed successfully

#### 2. User Model
- **File**: `app/Models/User.php`
- Added `phone` to `$fillable` array to allow mass assignment

#### 3. Auth Controller
- **File**: `app/Http/Controllers/Api/V1/AuthController.php`
- **Sign-up**: Accept optional `phone` parameter, validate max 50 chars
- **Profile Update**: Accept optional `phone` parameter, persist to database
- **User Resource**: Include `phone` in API response

#### 4. Checkout Controller
- **File**: `app/Http/Controllers/Api/V1/CheckoutController.php`
- Made `phone` field **required** in checkout validation
- Store `phone` as `contact_phone` on the Order model

#### 5. Order Controller (Public)
- **File**: `app/Http/Controllers/Api/V1/OrderController.php`
- Expose `contactPhone` in order resource for user-facing APIs

#### 6. Order Controller (Admin)
- **File**: `app/Http/Controllers/Api/V1/Admin/OrderController.php`
- Expose `contactPhone` in admin order list and detail resources

#### 7. Track Order Controller
- **File**: `app/Http/Controllers/Api/V1/TrackOrderController.php`
- Updated phone verification to use `contact_phone` as fallback for COD orders
- Improved error messaging

#### 8. Order Model
- **File**: `app/Models/Order.php`
- Added `contact_phone` to `$fillable` array

### Frontend Updates

#### 1. User Type
- **File**: `frontend/src/store/slices/authSlice.ts`
- Added optional `phone?: string | null` to User interface

#### 2. Auth API
- **File**: `frontend/src/api/auth.ts`
- Extended `updateProfile` to accept optional `phone` parameter

#### 3. Orders API
- **File**: `frontend/src/api/orders.ts`
- Added `contactPhone?: string | null` to Order interface (already present)

#### 4. Admin API
- **File**: `frontend/src/api/admin.ts`
- Added `contactPhone?: string | null` to AdminOrder interface

#### 5. Profile Page
- **File**: `frontend/src/pages/Profile.tsx`
- Added phone field to profile form (between name and email)
- Phone input shows validation pattern: 6-20 chars, numbers, +, (), -
- Non-edit view shows amber warning if phone is missing: "Add your phone to complete checkout"
- Phone persists to localStorage on successful update
- Integrated with Redux dispatch

#### 6. Checkout Modal
- **File**: `frontend/src/components/cart/CheckoutModal.tsx`
- **New Phone Field**: 
  - Positioned at top of form, required
  - Pre-filled with user's phone from auth (if available)
  - Validated with pattern: 6-20 chars, numbers, +, (), -, spaces
- **Coupon Section Redesigned**:
  - Changed from always-visible to collapsible
  - Button: "Have a coupon code?" with chevron toggle
  - Expands on click or when coupon applied
  - Applied coupon stays visible and expanded
  - Removed from coupon code removes applied discount
- **Form Validation**: Phone is now required before checkout, blocks submission if empty
- **Payload**: Phone is sent to backend as part of checkout payload

### Key Features

✅ Users can add/edit phone number in their profile  
✅ Phone is required at checkout (blocks submission if empty)  
✅ Phone is prefilled from user profile at checkout  
✅ Phone is persisted with order as `contact_phone`  
✅ Admin can see contact phone for each order  
✅ Order tracking uses contact phone for verification (with fallback for COD)  
✅ Coupon field is hidden by default, visible on "Have a coupon code?" click  
✅ Users see warning in profile if phone is not set  
✅ Phone validation prevents invalid numbers  

### Testing Checklist

- [ ] Sign up with phone (optional in signup)
- [ ] Edit profile and add phone number
- [ ] Verify phone persists in localStorage and Redux
- [ ] Open checkout and verify phone is pre-filled
- [ ] Try to submit checkout without phone (should show error)
- [ ] Add phone and verify it's sent to backend
- [ ] Check admin order detail shows contact_phone
- [ ] Try applying coupon in checkout
- [ ] Verify coupon section toggles properly
- [ ] Track order using contact_phone

### Notes

- Phone field is optional in sign-up but **required** at checkout
- Coupon field is hidden by default (better UX, less clutter)
- Contact phone is stored separately from user phone (allows for different phone at checkout)
- Phone validation regex: `/^[0-9+()\-\s]{6,20}$/` - allows common phone formats
- All changes are backward compatible
