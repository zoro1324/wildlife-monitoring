"""
Management command to seed the database with test users and devices.
Run with: python manage.py seed_data
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import UserProfile, Device


class Command(BaseCommand):
    help = 'Seed the database with test users and devices'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Seeding database...'))
        
        # Common mobile number for all users
        MOBILE_NUMBER = '+918122211543'
        
        # Seed Users
        users_data = [
            {
                'username': 'ranger_john',
                'email': 'john@wildlife.com',
                'password': 'Wildlife@123',
                'first_name': 'John',
                'last_name': 'Smith',
                'home_lat': 12.9716,  # Bangalore
                'home_lon': 77.5946,
            },
            {
                'username': 'ranger_sarah',
                'email': 'sarah@wildlife.com',
                'password': 'Wildlife@123',
                'first_name': 'Sarah',
                'last_name': 'Johnson',
                'home_lat': 12.9352,  # Near Bangalore
                'home_lon': 77.6245,
            },
            {
                'username': 'admin_mike',
                'email': 'mike@wildlife.com',
                'password': 'Wildlife@123',
                'first_name': 'Mike',
                'last_name': 'Wilson',
                'home_lat': 13.0827,  # Chennai area
                'home_lon': 80.2707,
                'is_staff': True,
            },
            {
                'username': 'ranger_priya',
                'email': 'priya@wildlife.com',
                'password': 'Wildlife@123',
                'first_name': 'Priya',
                'last_name': 'Kumar',
                'home_lat': 12.2958,  # Mysore area
                'home_lon': 76.6394,
            },
            {
                'username': 'ranger_raj',
                'email': 'raj@wildlife.com',
                'password': 'Wildlife@123',
                'first_name': 'Raj',
                'last_name': 'Patel',
                'home_lat': 12.9141,  # Whitefield, Bangalore
                'home_lon': 77.6411,
            },
        ]
        
        created_users = []
        for i, user_data in enumerate(users_data):
            username = user_data['username']
            
            # Check if user exists
            if User.objects.filter(username=username).exists():
                user = User.objects.get(username=username)
                self.stdout.write(f'  User "{username}" already exists, updating...')
            else:
                user = User.objects.create_user(
                    username=username,
                    email=user_data['email'],
                    password=user_data['password'],
                    first_name=user_data['first_name'],
                    last_name=user_data['last_name'],
                )
                if user_data.get('is_staff'):
                    user.is_staff = True
                    user.save()
                self.stdout.write(self.style.SUCCESS(f'  Created user: {username}'))
            
            # Update profile - use unique mobile for first user, None for others to avoid unique constraint
            if i == 0:
                user.profile.mobile_number = MOBILE_NUMBER
            else:
                # Clear mobile number for other users since it must be unique
                user.profile.mobile_number = None
            user.profile.home_lat = user_data['home_lat']
            user.profile.home_lon = user_data['home_lon']
            user.profile.user_type = 'ranger'  # All seed users are rangers
            user.profile.save()
            
            created_users.append(user)
        
        self.stdout.write(self.style.SUCCESS(f'\n✓ Created/Updated {len(created_users)} users'))
        
        # Seed Devices
        devices_data = [
            {
                'device_id': 'ESP32-CAM-001',
                'lat': 12.9716,
                'lon': 77.5946,
                'owner_index': 0,  # ranger_john
            },
            {
                'device_id': 'ESP32-CAM-002',
                'lat': 12.9352,
                'lon': 77.6245,
                'owner_index': 1,  # ranger_sarah
            },
            {
                'device_id': 'ESP32-CAM-003',
                'lat': 13.0827,
                'lon': 80.2707,
                'owner_index': 2,  # admin_mike
            },
            {
                'device_id': 'ESP32-CAM-004',
                'lat': 12.2958,
                'lon': 76.6394,
                'owner_index': 3,  # ranger_priya
            },
            {
                'device_id': 'ESP32-CAM-005',
                'lat': 12.9500,
                'lon': 77.5800,
                'owner_index': None,  # Unassigned device
            },
            {
                'device_id': 'ESP32-CAM-006',
                'lat': 12.9800,
                'lon': 77.6100,
                'owner_index': 0,  # ranger_john (second device)
            },
        ]
        
        created_devices = []
        for device_data in devices_data:
            device_id = device_data['device_id']
            
            device, created = Device.objects.get_or_create(
                device_id=device_id,
                defaults={
                    'lat': device_data['lat'],
                    'lon': device_data['lon'],
                }
            )
            
            if not created:
                device.lat = device_data['lat']
                device.lon = device_data['lon']
            
            # Assign owner
            owner_index = device_data['owner_index']
            if owner_index is not None and owner_index < len(created_users):
                device.owned_by = created_users[owner_index]
            else:
                device.owned_by = None
            
            device.save()
            created_devices.append(device)
            
            status = 'Created' if created else 'Updated'
            owner_name = device.owned_by.username if device.owned_by else 'Unassigned'
            self.stdout.write(self.style.SUCCESS(f'  {status} device: {device_id} (Owner: {owner_name})'))
        
        self.stdout.write(self.style.SUCCESS(f'\n✓ Created/Updated {len(created_devices)} devices'))
        
        # Print summary
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS('SEED DATA SUMMARY'))
        self.stdout.write('='*50)
        self.stdout.write(f'\nMobile Number (for notifications): {MOBILE_NUMBER}')
        self.stdout.write('\nUsers:')
        for user in created_users:
            mobile = user.profile.mobile_number or 'N/A'
            self.stdout.write(f'  - {user.username} ({user.email}) | Mobile: {mobile}')
            self.stdout.write(f'    Home: ({user.profile.home_lat}, {user.profile.home_lon})')
        
        self.stdout.write('\nDevices:')
        for device in created_devices:
            owner = device.owned_by.username if device.owned_by else 'Unassigned'
            self.stdout.write(f'  - {device.device_id} | Owner: {owner}')
            self.stdout.write(f'    Location: ({device.lat}, {device.lon})')
        
        self.stdout.write('\n' + self.style.SUCCESS('✓ Database seeding completed!'))
        self.stdout.write(self.style.WARNING('\nTest credentials: Password for all users is "Wildlife@123"'))
