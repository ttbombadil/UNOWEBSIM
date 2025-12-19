void setup()
{
    Serial.begin(115200);
    pinMode(8, INPUT_PULLUP);
    pinMode(7, INPUT);
    pinMode(6, OUTPUT);
    pinMode(5, OUTPUT);
}

void loop()
{
    analogWrite(5, 128);
    digitalWrite(6, !digitalRead(6));
    delay(100);
}