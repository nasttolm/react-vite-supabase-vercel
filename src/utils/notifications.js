import supabase from "./supabase";

/**
 * Send meal planning reminders to users
 * This function should be scheduled to run periodically (e.g., every hour)
 */
export async function sendMealPlanningReminders() {
  try {
    // Get current time and day of week
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
    
    // Get users who have notifications set for the current day
    const { data: users, error } = await supabase
      .from("user_profiles")
      .select("id, first_name, last_name, email, notification_settings")
      .filter('notification_settings->enabled', 'eq', true)
      .filter('notification_settings->day', 'eq', currentDay);
    
    if (error) throw error;
    
    // Send notifications to users whose notification time matches the current hour
    for (const user of users) {
      const notificationTime = user.notification_settings.time;
      const [notificationHour] = notificationTime.split(':').map(Number);
      
      // Check if current time matches the notification time (hour precision)
      if (notificationHour === currentHour) {
        await sendNotificationToUser(user);
      }
    }
    
    return { success: true, message: "Reminders sent successfully" };
  } catch (error) {
    console.error("Error sending meal planning reminders:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Send notification to a specific user
 * @param {Object} user - User to send notification to
 */
async function sendNotificationToUser(user) {
  // Here you can implement sending an email, push notification, or other type of notification
  console.log(`Sending meal planning reminder to ${user.first_name} ${user.last_name}`);
  
  // Example of sending an email (requires email service setup)
  // await sendEmail({
  //   to: user.email,
  //   subject: "Time to plan your weekly meals!",
  //   body: `
  //     <h1>Hello ${user.first_name}!</h1>
  //     <p>It's time to plan your weekly meals and shopping list.</p>
  //     <p>Visit our app to create your meal plan for the week ahead.</p>
  //     <a href="https://yourapp.com/meal-planner" style="background-color: #ff5722; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Plan My Meals</a>
  //   `
  // });
  
  // You can also save the notification in the database to display in the app
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: user.id,
      type: "meal_planning_reminder",
      title: "Time to plan your weekly meals!",
      message: "It's time to plan your weekly meals and shopping list.",
      read: false,
      created_at: new Date()
    });
  
  if (error) throw error;
  
  return data;
}