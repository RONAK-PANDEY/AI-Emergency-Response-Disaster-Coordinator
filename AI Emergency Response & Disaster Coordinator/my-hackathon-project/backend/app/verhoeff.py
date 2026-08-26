"""
Verhoeff Algorithm for Indian Aadhaar Number Validation.
"""

# Multiplication table
d = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
]

# Permutation table
p = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
]

# Inverse table
inv = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9]


def validate_aadhaar(aadhaar: str) -> bool:
    """
    Validates a 12-digit Indian Aadhaar number using the Verhoeff algorithm.
    Allows spaces/dashes, strips them before validation.
    """
    if not aadhaar:
        return False
    
    clean = "".join(ch for ch in str(aadhaar) if ch.isdigit())
    if len(clean) != 12:
        return False

    # Aadhaar cannot start with 0 or 1
    if clean[0] in ['0', '1']:
        return False

    c = 0
    reversed_digits = [int(x) for x in reversed(clean)]
    for i, digit in enumerate(reversed_digits):
        c = d[c][p[i % 8][digit]]

    return c == 0


def mask_aadhaar(aadhaar: str) -> str:
    """Returns masked Aadhaar format: XXXX-XXXX-1234"""
    clean = "".join(ch for ch in str(aadhaar) if ch.isdigit())
    if len(clean) == 12:
        return f"XXXX-XXXX-{clean[-4:]}"
    elif len(clean) >= 4:
        return f"XXXX-XXXX-{clean[-4:]}"
    return "XXXX-XXXX-XXXX"
