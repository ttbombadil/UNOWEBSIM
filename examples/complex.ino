#include <Arduino.h>

class Map {
  private:
    int width, height;
    char **map; // 2D-Array für die Karte

    // Hilfsmethode zum Platzieren von Blöcken von vier zusammenhängenden Hindernissen
    void placeObstacleBlocks() {
      bool placed = false;

      while (!placed) {
        int startX = random(0, width - 1);
        int startY = random(0, height - 1);
        int orientation = random(0, 4); // 0: horizontal, 1: vertikal, 2: diagonal-rechts, 3: diagonal-links

        bool canPlace = true;
        // Überprüfen, ob der Bereich frei ist und Platz für den Block vorhanden ist
        switch (orientation) {
          case 0: // Horizontal
            if (startX + 3 < width) {
              for (int i = 0; i < 4; ++i) {
                if (map[startY][startX + i] != ' ') {
                  canPlace = false;
                  break;
                }
              }
            } else {
              canPlace = false;
            }
            break;

          case 1: // Vertikal
            if (startY + 3 < height) {
              for (int i = 0; i < 4; ++i) {
                if (map[startY + i][startX] != ' ') {
                  canPlace = false;
                  break;
                }
              }
            } else {
              canPlace = false;
            }
            break;

          case 2: // Diagonal-rechts
            if (startX + 3 < width && startY + 3 < height) {
              for (int i = 0; i < 4; ++i) {
                if (map[startY + i][startX + i] != ' ') {
                  canPlace = false;
                  break;
                }
              }
            } else {
              canPlace = false;
            }
            break;

          case 3: // Diagonal-links
            if (startX - 3 >= 0 && startY + 3 < height) {
              for (int i = 0; i < 4; ++i) {
                if (map[startY + i][startX - i] != ' ') {
                  canPlace = false;
                  break;
                }
              }
            } else {
              canPlace = false;
            }
            break;
        }

        if (canPlace) {
          // Platzieren der vier Hindernisse
          switch (orientation) {
            case 0: // Horizontal
              for (int i = 0; i < 4; ++i) {
                map[startY][startX + i] = '#';
              }
              break;

            case 1: // Vertikal
              for (int i = 0; i < 4; ++i) {
                map[startY + i][startX] = '#';
              }
              break;

            case 2: // Diagonal-rechts
              for (int i = 0; i < 4; ++i) {
                map[startY + i][startX + i] = '#';
              }
              break;

            case 3: // Diagonal-links
              for (int i = 0; i < 4; ++i) {
                map[startY + i][startX - i] = '#';
              }
              break;
          }
          placed = true;
        }
      }
    }

    // Hilfsmethode zum Überprüfen, ob ein Feld gültig ist
    bool isValid(int x, int y) {
      return (x >= 0 && x < width && y >= 0 && y < height && (map[y][x] == ' ' || map[y][x] == 'G'));
    }

    // Eigene Implementierung einer simplen Queue für den Flood-Fill-Algorithmus
    struct Queue {
      int front, rear;
      int queueSize;
      int (*data)[2]; // Array von 2D-Paaren (x, y)

      // Konstruktor zum Initialisieren der Queue
      Queue(int maxSize) {
        queueSize = maxSize;
        front = rear = 0;
        data = new int[maxSize][2]; // 2D-Array zur Speicherung der Koordinaten
      }

      ~Queue() {
        delete[] data;
      }

      bool isEmpty() {
        return front == rear;
      }

      void enqueue(int x, int y) {
        data[rear][0] = x;
        data[rear][1] = y;
        rear = (rear + 1) % queueSize;
      }

      void dequeue(int &x, int &y) {
        x = data[front][0];
        y = data[front][1];
        front = (front + 1) % queueSize;
      }
    };

  public:
    // Konstruktor zum Initialisieren der Karte mit Dimensionen
    Map(int w, int h) {
      width = w;
      height = h;

      // Speicher für die Karte allozieren
      map = new char*[height];
      for (int i = 0; i < height; ++i) {
        map[i] = new char[width];
      }

      // Karte initialisieren
      initializeMap();
    }

    // Destruktor zum Freigeben des Speichers
    ~Map() {
      for (int i = 0; i < height; ++i) {
        delete[] map[i];
      }
      delete[] map;
    }

    // Methode zum Initialisieren der Karte
    void initializeMap() {
      for (int i = 0; i < height; ++i) {
        for (int j = 0; j < width; ++j) {
          map[i][j] = ' '; // Alles als offenen Knoten initialisieren
        }
      }
    }

    // Methode zum Erzeugen einer zufälligen Karte
    void generateRandomMap(byte obstacleCount = 4) {
      initializeMap();

      // Mehrere Block von vier zusammenhängenden Hindernissen platzieren
      for (int i = 0; i < obstacleCount; ++i) {
        placeObstacleBlocks();
      }

      // Zufällige Start- und Zielpositionen setzen
      map[random(0, height)][random(0, width)] = 'S'; // Start
      map[random(0, height)][random(0, width)] = 'G'; // Ziel
    }

    // Methode zum Ausgeben der Karte auf der seriellen Konsole
    void printMap() {
      // Rand oben
      Serial.print('+');
      for (int j = 0; j < width; ++j) {
        Serial.print("-"); // Ein Zeichen pro Spalte
      }
      Serial.println('+');

      // Karteninhalt
      for (int i = 0; i < height; ++i) {
        Serial.print('|');
        for (int j = 0; j < width; ++j) {
          Serial.print(map[i][j]); // Keine Leerzeichen zwischen den Zeichen
        }
        Serial.println('|');
      }

      // Rand unten
      Serial.print('+');
      for (int j = 0; j < width; ++j) {
        Serial.print("-"); // Ein Zeichen pro Spalte
      }
      Serial.println('+');
    }

    // Methode zum Füllen der Karte mit Zahlen ausgehend vom Startpunkt 'S'
    void fillWithNumbers() {
      // Finde die Startposition 'S'
      int startX = -1, startY = -1;
      for (int i = 0; i < height; ++i) {
        for (int j = 0; j < width; ++j) {
          if (map[i][j] == 'S') {
            startX = j;
            startY = i;
            break;
          }
        }
        if (startX != -1) break; // Wenn der Startpunkt gefunden wurde
      }

      if (startX == -1 || startY == -1) return; // Kein Startpunkt gefunden

      // Erstelle eine eigene Queue mit einer maximalen Größe (z.B. Breite * Höhe)
      Queue q(width * height);
      q.enqueue(startX, startY);
      int distance = 1;

      // Bewegungsrichtungen (rechts, links, oben, unten)
      int dx[] = {1, -1, 0, 0};
      int dy[] = {0, 0, 1, -1};

      // Während die Queue nicht leer ist
      bool goalReached = false;
      while (!q.isEmpty() && !goalReached) {
        int size = (q.rear - q.front + width * height) % (width * height);
        for (int i = 0; i < size; ++i) {
          int x, y;
          q.dequeue(x, y);

          // Gehe zu allen angrenzenden Feldern
          for (int d = 0; d < 4; ++d) {
            int newX = x + dx[d];
            int newY = y + dy[d];

            // Überprüfe, ob das neue Feld gültig ist
            if (isValid(newX, newY)) {
              if (map[newY][newX] == 'G') {
                goalReached = true;
                break; // Beende die Suche, wenn das Ziel erreicht ist
              }

              map[newY][newX] = '0' + distance; // Wandle die Zahl in ein Zeichen um
              q.enqueue(newX, newY);
            }
          }

          if (goalReached) break; // Schleife beenden, wenn das Ziel gefunden wurde
        }
        distance++;
      }
    }
};

// Globale Map-Instanz
Map myMap(30, 10);

void setup() {
  Serial.begin(9600);
  for (byte i = 0; i < 5; i++)
  {
    // Zufällige Karte generieren
    myMap.generateRandomMap();
    myMap.printMap();

    // Fülle die Karte mit Zahlen ausgehend von 'S'
    myMap.fillWithNumbers();
    myMap.printMap();
  }
}

void loop() {
  // Kein Code in der Endlosschleife benötigt
}
