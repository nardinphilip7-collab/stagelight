from django.core.management.base import BaseCommand
from api.models import User, Talent, Opportunity, Application, FeedItem


class Command(BaseCommand):
    help = 'Seed database with initial data'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding database...')

        # Clear existing data
        Application.objects.all().delete()
        FeedItem.objects.all().delete()
        Talent.objects.all().delete()
        Opportunity.objects.all().delete()

        # Create seed users
        artist_user, _ = User.objects.get_or_create(
            email='artist@stagelink.com',
            defaults={'role': 'ARTIST', 'first_name': 'Layla', 'last_name': 'Hassan'}
        )
        artist_user.set_password('password123')
        artist_user.save()

        artist_user2, _ = User.objects.get_or_create(
            email='omar@stagelink.com',
            defaults={'role': 'ARTIST', 'first_name': 'Omar', 'last_name': 'Khalid'}
        )
        artist_user2.set_password('password123')
        artist_user2.save()

        hirer_user, _ = User.objects.get_or_create(
            email='hirer@stagelink.com',
            defaults={'role': 'HIRER', 'first_name': 'Cairo', 'last_name': 'Studios'}
        )
        hirer_user.set_password('password123')
        hirer_user.save()

        # Create Talents
        t1 = Talent.objects.create(
            id='1',
            owner=artist_user,
            name='Layla Hassan',
            category='Acting',
            avatar='https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop',
            verified=True,
            location='Cairo, Egypt',
            followers=12400,
            rating=4.9,
            bio='Bilingual actress specializing in dramatic roles and historical fiction. Lead in "The Cairo Files" and supporting role in upcoming indie film "Sand & Sea".',
            agency='MENA Talent Agency',
            cover_gradient='from-violet-600 via-purple-700 to-indigo-800',
            skills=['Acting', 'Voice Acting', 'Stage Combat', 'Arabic', 'English'],
            badges=['Verified Pro', 'Top Rated', 'SAG-AFTRA'],
            credits=[
                {'title': 'The Cairo Files', 'role': 'Lead', 'year': 2023},
                {'title': 'Sand & Sea', 'role': 'Supporting', 'year': 2024},
            ],
            languages=['Arabic', 'English', 'French'],
            union_name='SAG-AFTRA',
        )
        t2 = Talent.objects.create(
            id='2',
            owner=artist_user2,
            name='Omar Khalid',
            category='Music',
            avatar='https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=256&auto=format&fit=crop',
            verified=True,
            location='Dubai, UAE',
            followers=8900,
            rating=4.8,
            bio='Composer and vocalist blending traditional Arabic maqam with modern electronic production.',
            cover_gradient='from-blue-600 via-indigo-700 to-violet-800',
            skills=['Composition', 'Vocals', 'Oud', 'Piano', 'Music Production'],
            badges=['Verified Pro', 'Rising Star'],
            credits=[
                {'title': 'Nile Echoes', 'role': 'Composer', 'year': 2023},
            ],
            languages=['Arabic', 'English'],
        )

        # Create Opportunities
        o1 = Opportunity.objects.create(
            id='o1',
            owner=hirer_user,
            title='Lead Actress — Feature Film "Nile Noir"',
            company='Cairo Film Studios',
            company_logo='Film',
            type='Film Role',
            category='Acting',
            location='Cairo, Egypt',
            compensation='$5k - $10k',
            deadline='Jun 15, 2024',
            urgent=True,
            featured=True,
            description='Seeking a lead actress for a neo-noir feature film set in 1950s Cairo. Must be fluent in Arabic and English, with strong dramatic range.',
            posted='2h ago',
            applicants=42,
            requirements=['Fluent Arabic and English', 'Strong dramatic range', 'Available June–August 2024'],
            submission_type='SELF_TAPE',
        )
        Opportunity.objects.create(
            id='o2',
            owner=hirer_user,
            title='Studio Vocalist — Album Recording',
            company='Desert Sound Records',
            company_logo='Music',
            type='Recording Contract',
            category='Music',
            location='Dubai, UAE',
            compensation='$2k - $4k',
            deadline='May 30, 2024',
            urgent=False,
            featured=False,
            description='Looking for a studio vocalist with strong R&B and soul range for a 10-track album.',
            posted='1d ago',
            applicants=18,
            requirements=['R&B/Soul vocal range', 'Studio recording experience'],
            submission_type='SELF_TAPE',
        )

        # Create Applications
        Application.objects.create(
            id='a1',
            opportunity=o1,
            talent=t1,
            stage='Callback',
            cover_note="Hi! I've been a huge fan of your work at Cairo Film Studios. My bilingual background and dramatic training make me a strong fit for this role.",
            video_url='https://www.youtube.com/embed/dQw4w9WgXcQ'
        )

        # Create Feed Items
        FeedItem.objects.create(
            id='f1',
            owner=artist_user,
            author_name='Layla Hassan',
            author_role='Actor',
            author_avatar='https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop',
            verified=True,
            time='2h ago',
            description='My self-tape for the Nile Noir lead role. Three years of preparation for this moment.',
            category='Acting',
            gradient='from-violet-600 via-purple-700 to-indigo-800',
            emoji='Film',
            likes=4820,
            comments=231,
            shares=89
        )
        FeedItem.objects.create(
            id='f2',
            owner=artist_user2,
            author_name='Omar Khalid',
            author_role='Musician',
            author_avatar='https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=256&auto=format&fit=crop',
            verified=True,
            time='5h ago',
            description='Studio session for the new album — blending oud with synthesizers. Excited to share what we\'ve been working on.',
            category='Music',
            gradient='from-blue-600 via-indigo-700 to-violet-800',
            emoji='Music',
            likes=2100,
            comments=98,
            shares=44
        )

        self.stdout.write(self.style.SUCCESS(
            'Successfully seeded database!\n'
            'Test accounts:\n'
            '  artist@stagelink.com / password123\n'
            '  omar@stagelink.com   / password123\n'
            '  hirer@stagelink.com  / password123'
        ))
