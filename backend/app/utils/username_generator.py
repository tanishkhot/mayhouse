import random
import string
from typing import Set
from supabase import Client

# Travel-themed word lists for elegant username generation
ADVENTURE_WORDS = [
    "Odyssey", "Journey", "Voyage", "Quest", "Explorer", "Wanderer", "Nomad", "Roamer",
    "Traveler", "Adventurer", "Pilgrim", "Seeker", "Discoverer", "Navigator", "Pioneer",
    "Trailblazer", "Pathfinder", "Wayfarer", "Globetrotter", "Backpacker"
]

EXPERIENCE_WORDS = [
    "Experience", "Story", "Tale", "Memory", "Moment", "Adventure", "Chapter", "Scene",
    "Episode", "Encounter", "Discovery", "Find", "Gem", "Treasure", "Secret", "Wonder",
    "Magic", "Spark", "Glow", "Glimpse"
]

LOCATION_WORDS = [
    "Coastal", "Island", "Harbor", "Bay", "Summit", "Valley", "Ridge", "Peak",
    "Canyon", "River", "Lake", "Forest", "Desert", "Meadow", "Trail", "Path"
]

def generate_elegant_username(db: Client, max_attempts: int = 10) -> str:
    """
    Generate an elegant, travel-themed username that's unique in the database.
    
    Pattern: [AdventureWord][Number] or [ExperienceWord][Number] or [LocationWord][Number]
    Examples: Odyssey247, Journey892, Explorer456, Coastal123
    
    Args:
        db: Supabase client for uniqueness checking
        max_attempts: Maximum attempts to find a unique username
        
    Returns:
        A unique username string
        
    Raises:
        RuntimeError: If unable to generate unique username after max_attempts
    """
    
    # Combine all word lists for variety
    all_words = ADVENTURE_WORDS + EXPERIENCE_WORDS + LOCATION_WORDS
    
    for attempt in range(max_attempts):
        # Choose random word and 3-digit number
        word = random.choice(all_words)
        number = random.randint(100, 999)
        username = f"{word}{number}"
        
        # Check if username is unique in database
        if is_username_unique(db, username):
            return username
    
    # Fallback: use timestamp-based username if all attempts fail
    import time
    timestamp = int(time.time() % 10000)  # Last 4 digits of timestamp
    fallback_username = f"Traveler{timestamp}"
    
    # Final uniqueness check for fallback
    if is_username_unique(db, fallback_username):
        return fallback_username
    
    # Ultimate fallback with random suffix
    random_suffix = ''.join(random.choices(string.digits, k=4))
    ultimate_fallback = f"User{random_suffix}"
    
    return ultimate_fallback


def is_username_unique(db: Client, username: str) -> bool:
    """
    Check if a username is unique in the database.
    
    Args:
        db: Supabase client
        username: Username to check
        
    Returns:
        True if username is unique, False otherwise
    """
    try:
        result = db.table('users').select('id').eq('username', username).limit(1).execute()
        return len(result.data) == 0
    except Exception as e:
        # If there's an error checking (e.g., table doesn't exist yet), assume unique
        print(f"Warning: Could not check username uniqueness: {e}")
        return True


def generate_username_suggestions(base_username: str, count: int = 5) -> list[str]:
    """
    Generate alternative username suggestions based on a base username.
    Useful for when user wants to customize their auto-generated username.
    
    Args:
        base_username: Base username to create variations from
        count: Number of suggestions to generate
        
    Returns:
        List of suggested usernames
    """
    suggestions = []
    
    # Extract word part (remove numbers)
    base_word = ''.join([c for c in base_username if c.isalpha()])
    
    for _ in range(count):
        # Generate new number
        number = random.randint(100, 999)
        suggestion = f"{base_word}{number}"
        suggestions.append(suggestion)
    
    return suggestions


def validate_username(username: str) -> tuple[bool, str]:
    """
    Validate username according to business rules.
    
    Args:
        username: Username to validate
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not username:
        return False, "Username is required"
    
    if len(username) < 3:
        return False, "Username must be at least 3 characters long"
    
    if len(username) > 30:
        return False, "Username must be 30 characters or less"
    
    if not username.replace('_', '').replace('-', '').isalnum():
        return False, "Username can only contain letters, numbers, underscores, and hyphens"
    
    if username.startswith('_') or username.startswith('-'):
        return False, "Username cannot start with underscore or hyphen"
    
    if username.endswith('_') or username.endswith('-'):
        return False, "Username cannot end with underscore or hyphen"
    
    # Check for reserved words
    reserved_words = ['admin', 'api', 'www', 'app', 'support', 'help', 'about', 'contact']
    if username.lower() in reserved_words:
        return False, "Username is reserved and cannot be used"
    
    return True, ""

