# Procesos App Iglesia

## Proceso

1. Recopila datos del nuevo.
2. Firma el tratado de datos.
3. Se clasifica.
4. Se hacen llamadas.

   * Se asignan padres espirituales.
   * Anotaciones de llamadas.
5. Se pone el estado de la persona.
6. Reporte de seguimiento.

   * Consolidación.
   * Cuántos nuevos.
   * Cuántos permanecen en la iglesia.
   * Cuántos bautizados.

---

# Requerimientos conforme al proceso

## 1. Recopilación de datos

### a. Persona (padre espiritual, administrador)

1. Fecha de registro.
2. Servicio al que asistió.
3. Cédula.
4. Nombre completo.
5. Dirección.
6. Barrio.
7. Celular.
8. Quién lo registró.
9. Especialidad.

   * Viene de otra iglesia cristiana.

     * ¿Cuál?
     * Detalles.
   * Joven.

     * Sí.
     * No.
   * Normal.
   * Distancia.
10. Padre espiritual (administrador).
11. Firma.
12. Visual si hizo primera llamada o no (admin).
13. Anotación primera llamada (admin).
14. Visual si hizo segunda llamada o no (admin).
15. Anotación segunda llamada (admin).
16. Visual si hizo tercera llamada o no (admin).
17. Anotación tercera llamada (admin).
18. Estado (permanencia en la iglesia).
    Calificación si es efectivo o no, depende de las llamadas (semaforización) (admin-padre espiritual).
19. Inscrito a fundamentos 1.
20. Bautizado (si en columna de tabla bautizado) (admin).

### b. Asesor (administrador)

1. Identificador de asesor.
2. Nombre completo.
3. Asignación.

   * Admin.
   * Padre espiritual.
   * Maestro.
4. Especialidad (padre espiritual).

   * Joven.
   * Normal.
   * Otra iglesia.
   * Distancia.
5. Firma.

---

# 2. Llamada

## a. Administración de llamadas (administrador)

## b. Recomendaciones

## c. Primera llamada (padre espiritual)

1. Aviso al administrador si se llamó o no y por quién.
2. Hora y fecha de cuando debe llamar.
3. Aviso de tiempo a padre espiritual.
4. Anotación de llamada.
5. Firma de quien hizo la llamada.
6. Estado.

   * Efectivo.
   * No efectivo.

## d. Segunda llamada (padre espiritual)

1. Aviso al administrador si se llamó o no y por quién.
2. Aviso de tiempo a padre espiritual.
3. Anotación de llamada.
4. Nombre de quien hizo la llamada.
5. Firma de quien hizo la llamada.

## e. Tercera llamada

1. Aviso al administrador si se llamó o no y por quién.
2. Aviso de tiempo a padre espiritual.
3. Anotación de llamada.
4. Inscrito a fundamentos 1.
5. Firma de quien hizo la llamada.

---

# 3. Bautizo (maestro)

## a. Datos extra de nuevo

1. Cédula.
2. Edad.
3. Nombre acudiente.
4. Número de acudiente.
5. Clase.

   * Hora de clase.
   * Profesor.
   * Modalidad.

     * Virtual.
     * Presencial templo.
     * Presencial Grupo Vida.
6. Decisión de bautizo.

   * Sí.
   * No.
   * Indeciso.
7. Foto persona (opcional).
8. Talla camiseta.
9. Tiempo en la iglesia.
10. Bautizado.

    * Sí.
    * No.
11. Detalles.

---

# 4. Reporte de seguimiento (administrador)

## a. Gráfica semanal, mensual y anual

1. Cuántos se consolidaron (todas las personas registradas).
2. Cuántos nuevos (no es de otra iglesia cristiana).
3. Cuántos permanecen en la iglesia (estado en efectivo).
4. Cuántos bautizados (todos los de la tabla bautizado con columna bautizados en sí).

---

# Roles, permisos y acciones

| Rol              | Permisos                             | Acciones                                                   |
| ---------------- | ------------------------------------ | ---------------------------------------------------------- |
| Administrador    | Personas, asesor, llamadas, bautizos | CRUD personas, CRUD asesores, CRUD llamadas, CRUD bautizos |
| Padre espiritual | Personas, llamadas                   | Crear persona, editar llamadas                             |
| Maestro          | Bautizos                             | CRU bautizos                                               |

---

# Lógica de negocios

* Hash de contraseñas.
* La firma debe ser tomada en el registro, debe con su dedo o un lápiz para pantalla táctil escribir su firma y esta se debe guardar como imagen y en la base de datos la dirección de la imagen.
* Una vez se haga el registro del nuevo este debe ser asignado a un padre espiritual según la especialidad del padre espiritual y el nuevo.

  * Ejemplo: si la persona es joven, se asigna a un padre espiritual que tenga esta especialidad.
* También la asignación debe ser por sexo.

  * Si es hombre el nuevo debe ser asignado principalmente a un padre espiritual hombre.
  * Luego, de todos los hombres con esa especialidad, se elige hasta que tenga 3 personas asignadas.
  * En caso de no haber más padres disponibles simplemente se lo guarda con una bandera como “sin asignar”.
  * Aquellos que ya están asignados a un padre deben decir “asignado”.
* El administrador podrá asignar a cualquier padre espiritual sin importar las restricciones, pero debe salirle advertencias por cada restricción que se está violando y debe aceptar para asignar.
* Una vez se registre al nuevo y se le asigne a un padre espiritual, estas personas deben salirle al padre que se le asignó con un reloj en reversa en cada llamada.

  * Llamada 1 → 48 h.
  * Llamada 2 → 8 días después de registrar información de la primera llamada.
  * Llamada 3 → 8 días después de registrar información de la segunda llamada.
* En el panel de administración el administrador recibirá notificación de quién ya llamó (esto cuando se registre la información de cada llamada).
* En los paneles de administración tanto de los padres espirituales y del administrador:

  * Aquellos que se les va a cumplir el tiempo recibirán una notificación por WhatsApp (usando OpenWA) cuando falten:

    * 12 horas.
    * 6 horas.
    * 3 horas.
* También debe haber un semáforo de colores:

  * Verde cuando tiene más de la mitad de tiempo.
  * Amarillo cuando falte la mitad del tiempo requerido de llamadas.
  * Anaranjado cuando falte 1/4 del tiempo requerido de llamadas.
  * Rojo cuando se cumplió el tiempo.
* También debe recibir información si no se llamó a la persona y se marcará de primero en el panel de color rojo.
* Habrá un botón o una sección donde el asesor puede matricular a la persona a clase de fundamentos 1.
* Cuando se marque la casilla de bautizo esa persona le saldrá en un panel al maestro como pendiente para que él pueda tomar los datos extras de esa persona y también una vez se bautice deberá cambiar el estado de “no” o “indeciso” a “sí”.
* Debe haber un panel principal para el administrador donde podrá ver las gráficas que se piden pudiendo cambiar entre tiempos como semanal, mensual y anual y poder elegir una fecha en concreto.
* La aplicación debe ser responsive ya que la mayor parte del tiempo se usará en celular.
* Para manejar los permisos es con JWT.
* Todo lo que se necesite debe estar en contenedores.

---

# Base de datos

```sql
CREATE TABLE IF NOT EXISTS "RegisterUser" (
"id" INTEGER NOT NULL UNIQUE,
"user" INTEGER NOT NULL,
"names" TEXT NOT NULL,
"last_name" TEXT NOT NULL,
"document" NUMERIC(10) NOT NULL,
"phone" NUMERIC(10) NOT NULL,
"photo" TEXT NOT NULL,
PRIMARY KEY("id")
);

CREATE TABLE IF NOT EXISTS "AuthUser" (
"id" INTEGER NOT NULL UNIQUE,
"username" TEXT NOT NULL,
"email" TEXT NOT NULL,
"password" TEXT NOT NULL,
PRIMARY KEY("id")
);

CREATE TABLE IF NOT EXISTS "specialism" (
"id" INTEGER NOT NULL UNIQUE,
"name" TEXT NOT NULL,
"description" TEXT NOT NULL,
"is_active" BOOLEAN NOT NULL,
PRIMARY KEY("id")
);

CREATE TABLE IF NOT EXISTS "Role" (
"id" INTEGER NOT NULL UNIQUE,
"name" TEXT NOT NULL,
"description" TEXT NOT NULL,
PRIMARY KEY("id")
);

CREATE TABLE IF NOT EXISTS "neighborhood" (
"id" INTEGER NOT NULL UNIQUE,
"name" INTEGER NOT NULL,
"city" INTEGER NOT NULL,
PRIMARY KEY("id")
);

CREATE TABLE IF NOT EXISTS "City" (
"id" INTEGER NOT NULL UNIQUE,
"name" TEXT NOT NULL,
"country" TEXT NOT NULL,
PRIMARY KEY("id")
);

CREATE TABLE IF NOT EXISTS "Country" (
"id" INTEGER NOT NULL UNIQUE,
"name" TEXT NOT NULL,
PRIMARY KEY("id")
);

CREATE TABLE IF NOT EXISTS "church_service" (
"id" INTEGER NOT NULL UNIQUE,
"name" TEXT NOT NULL,
"description" TEXT NOT NULL,
"is_active" BOOLEAN NOT NULL,
PRIMARY KEY("id")
);

CREATE TABLE IF NOT EXISTS "Adviser" (
"id" INTEGER NOT NULL UNIQUE,
"profile" INTEGER NOT NULL,
"role" INTEGER NOT NULL,
"specialism" INTEGER NOT NULL,
"signature" TEXT NOT NULL,
"is_active" INTEGER NOT NULL,
PRIMARY KEY("id")
);

CREATE TABLE IF NOT EXISTS "Person" (
"id" INTEGER NOT NULL UNIQUE,
"names" TEXT NOT NULL,
"lastname" TEXT NOT NULL,
"document" NUMERIC(10) NOT NULL,
"phone" NUMERIC(10) NOT NULL,
"country" INTEGER NOT NULL,
"city" INTEGER NOT NULL,
"neighborhood" INTEGER NOT NULL,
"church_service" INTEGER NOT NULL,
"state" TEXT NOT NULL,
"comes_from" TEXT NOT NULL,
"registered_by" INTEGER NOT NULL,
"spiritual_father" INTEGER NOT NULL,
"signature" TEXT NOT NULL,
"is_yung" BOOLEAN NOT NULL,
"register_date" DATE NOT NULL,
"enrollment_fund_1" BOOLEAN NOT NULL,
"baptized" BOOLEAN NOT NULL,
PRIMARY KEY("id")
);

CREATE TABLE IF NOT EXISTS "Call" (
"id" INTEGER NOT NULL UNIQUE GENERATED BY DEFAULT AS IDENTITY,
"Person" INTEGER NOT NULL,
"call_number" INTEGER NOT NULL,
"created_in" DATE NOT NULL,
PRIMARY KEY("id")
);

CREATE TABLE IF NOT EXISTS "call_details" (
"id" INTEGER NOT NULL GENERATED BY DEFAULT AS IDENTITY,
"call" INTEGER NOT NULL,
"made_by" INTEGER NOT NULL,
"scheduled_date" DATE NOT NULL,
"date_made" DATE NOT NULL,
"made" BOOLEAN NOT NULL,
"state" TEXT NOT NULL,
"annotation" TEXT NOT NULL,
"signature" INTEGER NOT NULL,
PRIMARY KEY("id")
);

CREATE TABLE IF NOT EXISTS "baptismal register" (
"id" INTEGER NOT NULL GENERATED BY DEFAULT AS IDENTITY,
"person" INTEGER NOT NULL,
"teacher" INTEGER NOT NULL,
"age" INTEGER NOT NULL,
"attendant" INTEGER NOT NULL,
"class" INTEGER NOT NULL,
"baptism decision" BOOLEAN NOT NULL,
"photo" TEXT NOT NULL,
"shirt_size" TEXT NOT NULL,
"time" TEXT NOT NULL,
"baptized" BOOLEAN NOT NULL,
"details" TEXT NOT NULL,
"registration_date" DATE NOT NULL,
PRIMARY KEY("id")
);

CREATE TABLE IF NOT EXISTS "Attendant" (
"id" INTEGER NOT NULL GENERATED BY DEFAULT AS IDENTITY,
"full_name" TEXT NOT NULL,
"phone" NUMERIC(10) NOT NULL,
PRIMARY KEY("id")
);

CREATE TABLE IF NOT EXISTS "Class" (
"id" INTEGER NOT NULL GENERATED BY DEFAULT AS IDENTITY,
"calendar" INTEGER NOT NULL,
"professor" INTEGER NOT NULL,
"mode" INTEGER NOT NULL,
PRIMARY KEY("id")
);

CREATE TABLE IF NOT EXISTS "Mode" (
"id" INTEGER NOT NULL GENERATED BY DEFAULT AS IDENTITY,
"name" TEXT NOT NULL,
"description" TEXT NOT NULL,
PRIMARY KEY("id")
);

CREATE TABLE IF NOT EXISTS "Calendar" (
"id" INTEGER NOT NULL GENERATED BY DEFAULT AS IDENTITY,
"day" TEXT NOT NULL,
"hour" TIME NOT NULL,
"Description" TEXT NOT NULL,
PRIMARY KEY("id")
);
```

---

# Relaciones

```sql
ALTER TABLE "Person"
ADD FOREIGN KEY("id") REFERENCES "Call"("Person")
ON UPDATE NO ACTION ON DELETE NO ACTION;

ALTER TABLE "RegisterUser"
ADD FOREIGN KEY("user") REFERENCES "AuthUser"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;

ALTER TABLE "neighborhood"
ADD FOREIGN KEY("city") REFERENCES "City"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;

ALTER TABLE "City"
ADD FOREIGN KEY("country") REFERENCES "Country"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;

ALTER TABLE "Adviser"
ADD FOREIGN KEY("profile") REFERENCES "RegisterUser"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;

ALTER TABLE "Adviser"
ADD FOREIGN KEY("role") REFERENCES "Role"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;

ALTER TABLE "Adviser"
ADD FOREIGN KEY("specialism") REFERENCES "specialism"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;

ALTER TABLE "Person"
ADD FOREIGN KEY("country") REFERENCES "Country"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;

ALTER TABLE "Person"
ADD FOREIGN KEY("city") REFERENCES "City"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;

ALTER TABLE "Person"
ADD FOREIGN KEY("neighborhood") REFERENCES "neighborhood"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;

ALTER TABLE "Person"
ADD FOREIGN KEY("church_service") REFERENCES "church_service"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;

ALTER TABLE "Person"
ADD FOREIGN KEY("registered_by") REFERENCES "Adviser"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;

ALTER TABLE "Person"
ADD FOREIGN KEY("spiritual_father") REFERENCES "Adviser"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;

ALTER TABLE "Call"
ADD FOREIGN KEY("id") REFERENCES "call_details"("call")
ON UPDATE NO ACTION ON DELETE NO ACTION;

ALTER TABLE "call_details"
ADD FOREIGN KEY("made_by") REFERENCES "Adviser"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;

ALTER TABLE "baptismal register"
ADD FOREIGN KEY("person") REFERENCES "Person"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;

ALTER TABLE "baptismal register"
ADD FOREIGN KEY("teacher") REFERENCES "Adviser"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;

ALTER TABLE "baptismal register"
ADD FOREIGN KEY("attendant") REFERENCES "Attendant"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;

ALTER TABLE "Mode"
ADD FOREIGN KEY("id") REFERENCES "Class"("mode")
ON UPDATE NO ACTION ON DELETE NO ACTION;

ALTER TABLE "Class"
ADD FOREIGN KEY("id") REFERENCES "baptismal register"("class")
ON UPDATE NO ACTION ON DELETE NO ACTION;

ALTER TABLE "Class"
ADD FOREIGN KEY("professor") REFERENCES "Adviser"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;

ALTER TABLE "Calendar"
ADD FOREIGN KEY("id") REFERENCES "Class"("calendar")
ON UPDATE NO ACTION ON DELETE NO ACTION;
```
