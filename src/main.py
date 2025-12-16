from src.ui_cli import create_or_update_profile, generate_for_user
from .models import UserProfile
from . import datastore

def main():
    while True:
        print("\n1) Create/Update Profile")
        print("2) Generate Plan")
        print("3) Exit")
        choice = input("Choose: ").strip()

        if choice == "1":
            create_or_update_profile()
        elif choice == "2":
            user_id = input("User id: ").strip()
            users = datastore.load_users()
            match = next((u for u in users if u.get("user_id") == user_id), None)
            if not match:
                print("No user found. Create a profile first.")
                continue
            profile = UserProfile.from_dict(match)
            generate_for_user(profile)
        elif choice == "3":
            break
        else:
            print("Invalid choice.")

if __name__ == "__main__":
    main()
