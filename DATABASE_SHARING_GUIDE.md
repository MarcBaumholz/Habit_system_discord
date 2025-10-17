# 🔧 **Database Sharing Guide - Step by Step**

## 🎯 **What You Need to Share the Database:**

### **1. Your Notion Integration Name**
Based on your token, your integration is likely named something like:
- **"Discord Habit System"**
- **"Habit System Bot"** 
- **"Discord Bot Integration"**
- Or whatever you named it when you created it

### **2. Your Personality Database**
- **URL**: https://www.notion.so/marcbaumholz/8-Personality-DB-289d42a1faf580c8b37ac8be7a37fa9a
- **Database ID**: `289d42a1faf580c8b37ac8be7a37fa9a`

---

## 📋 **Step-by-Step Sharing Process:**

### **Step 1: Find Your Integration Name**
1. Go to: https://www.notion.so/my-integrations
2. Look for your integration (the one with token starting with `ntn_...`)
3. **Note the exact name** of your integration

### **Step 2: Go to Your Personality Database**
1. Open: https://www.notion.so/marcbaumholz/8-Personality-DB-289d42a1faf580c8b37ac8be7a37fa9a
2. You should see your "8. Personality DB" database

### **Step 3: Share the Database**
1. **Click the "Share" button** in the top right corner of the database
2. **Click "Add people, emails, groups, or integrations"**
3. **Search for your integration name** (from Step 1)
4. **Select the integration** from the dropdown
5. **Set permissions to "Can edit"** (this is crucial!)
6. **Click "Invite"**

### **Step 4: Verify Sharing**
After sharing, you should see:
- The integration listed in the "Shared with" section
- A green checkmark or confirmation message

---

## 🔍 **What to Look For:**

### **✅ Success Indicators:**
- Integration appears in "Shared with" list
- No error messages during sharing
- Database is accessible to the integration

### **❌ Common Issues:**
- **Integration not found**: Check the exact name at https://www.notion.so/my-integrations
- **Permission denied**: Make sure you're the owner of the database
- **Integration not working**: Verify the token is correct

---

## 🧪 **Test After Sharing:**

Once you've shared the database:

1. **Try `/onboard` in Discord**
2. **Fill out the modal**
3. **Submit the form**
4. **Check if a new row appears in your Notion database**

---

## 📞 **If You Can't Find the Integration:**

### **Alternative Method:**
1. Go to: https://www.notion.so/my-integrations
2. **Create a new integration** if needed:
   - Name: "Discord Habit System"
   - Associated workspace: Your workspace
3. **Copy the new token** and update your `.env` file
4. **Share the database** with the new integration

---

## 🎯 **Expected Result:**

After sharing the database, the error should disappear:
- ❌ **Before**: "Could not find database with ID..."
- ✅ **After**: Profile gets created successfully in Notion

**The database sharing is the final piece of the puzzle!** 🎉

Let me know what integration name you find, or if you need help with any of these steps!
