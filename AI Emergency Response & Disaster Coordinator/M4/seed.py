"""
seed.py

Clears the `incidents` table and inserts 30 sample incident records.
Run once before the demo:

    python seed.py
"""

from database import SessionLocal, engine, Base
from models import Incident, IncidentType, IncidentSeverity, IncidentStatus

INCIDENTS = [
    {
        "description": "Aag lag gayi hai godown mein near Ludhiana grain market, dhuan bahut zyada hai, please send fire brigade fast",
        "latitude": 30.901,
        "longitude": 75.8573,
        "type": IncidentType.FIRE,
        "severity": IncidentSeverity.HIGH,
    },
    {
        "description": "Car accident on GT Road near Jalandhar bypass, ek vyakti seriously injured, khoon bah raha hai",
        "latitude": 31.326,
        "longitude": 75.5762,
        "type": IncidentType.ACCIDENT,
        "severity": IncidentSeverity.HIGH,
    },
    {
        "description": "Heavy rain se galiyan mein paani bhar gaya hai in Amritsar's Ranjit Avenue, ghar ke andar water entering",
        "latitude": 31.634,
        "longitude": 74.8723,
        "type": IncidentType.FLOOD,
        "severity": IncidentSeverity.MEDIUM,
    },
    {
        "description": "My father collapsed suddenly, he is diabetic, not responding, we are near Model Town Ludhiana, need ambulance urgently",
        "latitude": 30.9084,
        "longitude": 75.8477,
        "type": IncidentType.OTHER,
        "severity": IncidentSeverity.CRITICAL,
    },
    {
        "description": "Short circuit se electric pole mein aag lagi hai residential area, sparks flying, bachon ko andar rakha hai",
        "latitude": 30.8951,
        "longitude": 75.8419,
        "type": IncidentType.FIRE,
        "severity": IncidentSeverity.MEDIUM,
    },
    {
        "description": "Bus overturned on Jalandhar-Amritsar highway, multiple passengers injured, mujhe help chahiye abhi",
        "latitude": 31.42,
        "longitude": 75.256,
        "type": IncidentType.ACCIDENT,
        "severity": IncidentSeverity.CRITICAL,
    },
    {
        "description": "Sutlej river ka water level badh raha hai near village outskirts Ludhiana, evacuation may be needed",
        "latitude": 30.821,
        "longitude": 75.78,
        "type": IncidentType.FLOOD,
        "severity": IncidentSeverity.HIGH,
    },
    {
        "description": "Elderly woman fell down stairs, possible fracture, unable to move, we are in Civil Lines Ludhiana",
        "latitude": 30.91,
        "longitude": 75.855,
        "type": IncidentType.OTHER,
        "severity": IncidentSeverity.MEDIUM,
    },
    {
        "description": "Kitchen mein cylinder blast hua hai, ghar ka ek hissa damage, kripya turant madad bhejo",
        "latitude": 31.335,
        "longitude": 75.579,
        "type": IncidentType.FIRE,
        "severity": IncidentSeverity.CRITICAL,
    },
    {
        "description": "Two bike riders collided near Amritsar railway station, dono behosh pade hain road pe",
        "latitude": 31.61,
        "longitude": 74.857,
        "type": IncidentType.ACCIDENT,
        "severity": IncidentSeverity.HIGH,
    },
    {
        "description": "Drainage overflow due to continuous baarish, shops ke andar paani ghus gaya hai market area Jalandhar",
        "latitude": 31.316,
        "longitude": 75.59,
        "type": IncidentType.FLOOD,
        "severity": IncidentSeverity.LOW,
    },
    {
        "description": "Pregnant woman having labor pains, ghar pe koi vehicle nahi hai, need ambulance to hospital immediately",
        "latitude": 30.899,
        "longitude": 75.86,
        "type": IncidentType.OTHER,
        "severity": IncidentSeverity.CRITICAL,
    },
    {
        "description": "Factory fire spreading fast in industrial area, workers trapped inside, dhuan poore area mein phail gaya hai",
        "latitude": 30.885,
        "longitude": 75.839,
        "type": IncidentType.FIRE,
        "severity": IncidentSeverity.CRITICAL,
    },
    {
        "description": "Truck jackknifed on flyover near Ludhiana, traffic jam ho gaya hai, driver stuck inside cabin",
        "latitude": 30.92,
        "longitude": 75.865,
        "type": IncidentType.ACCIDENT,
        "severity": IncidentSeverity.MEDIUM,
    },
    {
        "description": "Canal overflow ki wajah se nearby fields aur houses mein paani ghus raha hai, urgent help needed",
        "latitude": 31.59,
        "longitude": 74.91,
        "type": IncidentType.FLOOD,
        "severity": IncidentSeverity.HIGH,
    },
    {
        "description": "Young boy having severe asthma attack, inhaler khatam ho gaya, we are near bus stand Jalandhar",
        "latitude": 31.326,
        "longitude": 75.581,
        "type": IncidentType.OTHER,
        "severity": IncidentSeverity.HIGH,
    },
    {
        "description": "Small fire in electrical wiring of apartment building, dhuan alarm baj raha hai, residents evacuating",
        "latitude": 31.625,
        "longitude": 74.865,
        "type": IncidentType.FIRE,
        "severity": IncidentSeverity.LOW,
    },
    {
        "description": "Scooter skidded on wet road, rider has head injury, khoon nikal raha hai, please send help fast",
        "latitude": 30.87,
        "longitude": 75.82,
        "type": IncidentType.ACCIDENT,
        "severity": IncidentSeverity.HIGH,
    },
    {
        "description": "Flash flood warning area, water entering ground floor homes, families need rescue boats Amritsar outskirts",
        "latitude": 31.57,
        "longitude": 74.83,
        "type": IncidentType.FLOOD,
        "severity": IncidentSeverity.CRITICAL,
    },
    {
        "description": "Old man having chest pain and breathlessness, possible heart attack, hum Sarabha Nagar mein hain",
        "latitude": 30.905,
        "longitude": 75.83,
        "type": IncidentType.OTHER,
        "severity": IncidentSeverity.CRITICAL,
    },
    {
        "description": "Warehouse containing chemicals caught fire, strong smell aa raha hai, area needs immediate evacuation",
        "latitude": 31.34,
        "longitude": 75.61,
        "type": IncidentType.FIRE,
        "severity": IncidentSeverity.CRITICAL,
    },
    {
        "description": "Auto rickshaw hit by car at crossing, driver aur passenger dono ghayal hain, Jalandhar cantt area",
        "latitude": 31.3,
        "longitude": 75.57,
        "type": IncidentType.ACCIDENT,
        "severity": IncidentSeverity.MEDIUM,
    },
    {
        "description": "Continuous rain se basement mein paani bhar gaya, electrical equipment ke paas, dar lag raha hai short circuit ka",
        "latitude": 31.64,
        "longitude": 74.88,
        "type": IncidentType.FLOOD,
        "severity": IncidentSeverity.MEDIUM,
    },
    {
        "description": "Child swallowed something and is choking, ma ghabra gayi hai, need urgent medical guidance and ambulance",
        "latitude": 30.898,
        "longitude": 75.855,
        "type": IncidentType.OTHER,
        "severity": IncidentSeverity.HIGH,
    },
    {
        "description": "Field ki paraali mein aag lag gayi and spreading toward houses, dhuan se saans lena mushkil ho raha hai",
        "latitude": 30.78,
        "longitude": 75.76,
        "type": IncidentType.FIRE,
        "severity": IncidentSeverity.MEDIUM,
    },
    {
        "description": "Multi vehicle pile up on foggy highway near Ludhiana-Jalandhar road, several injured, visibility bahut kam hai",
        "latitude": 31.05,
        "longitude": 75.7,
        "type": IncidentType.ACCIDENT,
        "severity": IncidentSeverity.CRITICAL,
    },
    {
        "description": "Nallah overflow ke karan colony mein paani ghus gaya, bijli bhi chali gayi hai, kids stuck upstairs",
        "latitude": 31.605,
        "longitude": 74.845,
        "type": IncidentType.FLOOD,
        "severity": IncidentSeverity.HIGH,
    },
    {
        "description": "Worker fell from scaffolding at construction site, unconscious, sar se khoon beh raha hai, Model Town Jalandhar",
        "latitude": 31.33,
        "longitude": 75.565,
        "type": IncidentType.OTHER,
        "severity": IncidentSeverity.CRITICAL,
    },
    {
        "description": "Small shop fire due to firecracker spark, dukaan malik ne khud bujhane ki koshish ki but spreading",
        "latitude": 31.618,
        "longitude": 74.86,
        "type": IncidentType.FIRE,
        "severity": IncidentSeverity.LOW,
    },
    {
        "description": "Pedestrian hit by speeding car near market, log bhaag ke aaye but driver fled, victim ghayal hai bahut",
        "latitude": 30.915,
        "longitude": 75.848,
        "type": IncidentType.ACCIDENT,
        "severity": IncidentSeverity.HIGH,
    },
]


def seed():
    # Make sure tables exist before we try to touch them.
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Clear existing incidents (reports will cascade-delete via the
        # relationship's cascade="all, delete-orphan" + FK ondelete on DB
        # level isn't guaranteed, so delete explicitly per-row to trigger
        # ORM cascade behavior).
        deleted = 0
        for incident in db.query(Incident).all():
            db.delete(incident)
            deleted += 1
        db.commit()
        print(f"Cleared {deleted} existing incident(s).")

        # Insert fresh records
        objects = [
            Incident(
                type=item["type"],
                severity=item["severity"],
                latitude=item["latitude"],
                longitude=item["longitude"],
                description=item["description"],
                people_affected=0,
                status=IncidentStatus.REPORTED,
            )
            for item in INCIDENTS
        ]
        db.add_all(objects)
        db.commit()
        print(f"Inserted {len(objects)} incident(s).")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
