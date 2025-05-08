import { ProfileNameForm } from "@/components/custom/ProfileNameForm";
import { Breadcrumbs } from "@/components/custom/Breadcrumbs";

export const metadata = {
  title: "User Profile | TK2 Name Changer",
  description: "Manage your user profile and update your display name."
};

export default function ProfilePage() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <Breadcrumbs items={[
        { href: "/", label: "Home" },
        { href: "/profile", label: "Profile" }
      ]} />
      
      <h1 className="text-3xl font-bold mb-8">Your Profile</h1>
      
      <div className="grid gap-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Profile Settings</h2>
          <div className="bg-card rounded-lg shadow p-6">
            <ProfileNameForm />
          </div>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold mb-4">Your Suggestions</h2>
          <div className="bg-card rounded-lg shadow p-6">
            <p className="text-muted-foreground">
              You can view and manage all your track and battle arena name suggestions on their respective pages.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}