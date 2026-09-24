import { normalizeText } from "../../content/text";

/**
 * Glosario operativo en lenguaje simple (Stage 1, ayuda UX).
 * NO es contenido jurídico canónico: no modifica /content/domains,
 * no crea obligaciones y no sustituye el texto legal.
 * Estado: borrador explicativo pendiente de validación jurídica.
 * Cada término tiene definición clara y un ejemplo de aplicación
 * práctica en el trabajo diario con datos personales.
 */

export interface GlossaryTerm {
  slug: string;
  term: string;
  plain: string;
  example: string;
}

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    slug: "titular",
    term: "Titular",
    plain: "La persona a la que pertenecen los datos personales: el cliente, el trabajador, el paciente. En esta materia no es un simple “usuario”, sino la persona cuyos derechos se protegen.",
    example: "Una tienda que guarda el RUT de sus clientes debe tratar a cada uno como titular: puede pedir acceso o corrección de sus datos en cualquier momento.",
  },
  {
    slug: "tratamiento",
    term: "Tratamiento",
    plain: "Cualquier operación con datos personales: recolectarlos, guardarlos, ordenarlos, usarlos, compartirlos o borrarlos. Todo eso, incluso anotarlos en un Excel, es tratar datos.",
    example: "La planilla de clientes que lleva ventas en un Excel ya es un tratamiento: debe quedar inventariada igual que la base del CRM.",
  },
  {
    slug: "finalidad",
    term: "Finalidad",
    plain: "El para qué concreto se usan los datos. Debe definirse en forma corta y clara antes de pedirlos. Las fórmulas vagas como “fines comerciales generales” no sirven como finalidad.",
    example: "“Enviar ofertas mensuales por correo” sí es una finalidad verificable; “fines comerciales” escrito en un formulario, no.",
  },
  {
    slug: "responsable",
    term: "Responsable",
    plain: "La empresa o persona que decide para qué y cómo se usan los datos. No es responsable por ser dueño del negocio, sino por tomar esas decisiones sobre fines y medios.",
    example: "Si la empresa decide qué datos pedir para las nóminas y para qué usarlos, ella es la responsable aunque el cálculo lo haga un proveedor externo.",
  },
  {
    slug: "encargado-subencargado",
    term: "Encargado / subencargado",
    plain: "El encargado trata datos por cuenta del responsable y siguiendo sus instrucciones, como un proveedor de software o un contador externo. El subencargado es contratado por ese encargado para ayudarle con parte del trabajo.",
    example: "El contrato con el proveedor de la nube debe decir que actúa como encargado, y regular qué pasa si subcontrata el almacenamiento con un tercero.",
  },
  {
    slug: "base-licitud",
    term: "Base o fuente de licitud",
    plain: "El permiso legal que justifica usar datos para una finalidad concreta. Cada uso necesita su propia base: tener el dato no autoriza a usarlo para todo lo demás.",
    example: "El RUT entregado para emitir la factura no puede reusarse para publicidad: ese segundo uso necesita su propia base.",
  },
  {
    slug: "consentimiento",
    term: "Consentimiento",
    plain: "El sí de la persona. Para valer debe ser libre (sin presión ni engaño), previo (antes del uso), específico (para un uso concreto) e inequívoco (claro, con una acción afirmativa como marcar una casilla). Seguir usando una app no es consentir.",
    example: "Una casilla desmarcada que diga “acepto recibir ofertas por correo” puede valer; una casilla pre-marcada, no.",
  },
  {
    slug: "interes-legitimo",
    term: "Interés legítimo",
    plain: "Un permiso excepcional que a veces permite usar datos sin consentimiento, solo si es realmente necesario, no daña los derechos de la persona y se aplican resguardos. Debe analizarse y dejarse por escrito caso a caso.",
    example: "Las cámaras de un local por seguridad pueden justificarse por esta vía, pero hay que analizar la necesidad, avisar con carteles y dejar el análisis escrito.",
  },
  {
    slug: "obligacion-legal",
    term: "Obligación legal",
    plain: "Cuando una ley ordena guardar o entregar datos. Solo vale si una norma lo exige de verdad: una regla interna de la empresa o un contrato no son obligación legal.",
    example: "Contabilidad conserva las facturas con datos porque la norma tributaria lo ordena; conviene citar la norma exacta en el inventario.",
  },
  {
    slug: "contrato-precontractual",
    term: "Contrato y datos precontractuales",
    plain: "Los datos pedidos para preparar o cumplir un contrato o una cotización. Solo sirven para ese fin y no autorizan usos posteriores como publicidad.",
    example: "Los datos de una cotización no pueden pasar a la lista de marketing sin un nuevo permiso.",
  },
  {
    slug: "defensa-derechos",
    term: "Defensa de derechos ante tribunales",
    plain: "Usar datos porque son necesarios para un juicio o reclamo legal propio. La ley lo admite como permiso, pero limitado a lo necesario para esa defensa.",
    example: "Los correos del contrato en disputa se conservan solo mientras dure el juicio y para ese fin, no para otros análisis.",
  },
  {
    slug: "dato-sensible",
    term: "Dato sensible",
    plain: "Datos que la ley protege con reglas más estrictas, como salud, origen, creencias, vida sexual o biometría. Solo pueden tratarse en los casos cerrados que la ley enumera.",
    example: "Una encuesta interna que pida religión y salud “para conocernos” debe frenarse: exige una vía habilitante expresa.",
  },
  {
    slug: "datos-salud-perfil-biologico",
    term: "Datos de salud y perfil biológico",
    plain: "Datos sobre enfermedades, atenciones médicas o características del cuerpo. Además del permiso general, suelen exigir que una ley de salud lo autorice y que el uso esté previsto en ella.",
    example: "Antes de habilitar un sistema de fichas clínicas hay que verificar tanto el permiso del paciente como la cobertura en la normativa sanitaria.",
  },
  {
    slug: "datos-biometricos",
    term: "Datos biométricos",
    plain: "Datos del cuerpo usados con tecnología para identificar a alguien en forma única, como huella o rostro. No es la foto en sí: es su uso técnico para identificar.",
    example: "La foto de la credencial no es biométrica, pero el control de acceso por huella que identifica a cada trabajador sí lo es.",
  },
  {
    slug: "autorizacion-legal-expresa",
    term: "Autorización o mandato legal expreso",
    plain: "Cuando la ley dice en forma directa y clara que algo puede hacerse con datos para ese caso. Decir “la ley lo permite en general” no basta.",
    example: "Frente a un tratamiento de datos sensibles, hay que citar el artículo exacto que lo autoriza en vez de invocar “la ley” en abstracto.",
  },
  {
    slug: "nna",
    term: "Niños, niñas y adolescentes (NNA)",
    plain: "Personas menores de 18 años, con reglas de protección reforzada. Si tienen menos de 16 años y el dato es sensible, se requiere además la autorización de quien tiene su cuidado.",
    example: "El formulario de un taller de salud en un colegio debe pedir autorización del apoderado para los menores de 16 años.",
  },
  {
    slug: "geolocalizacion",
    term: "Geolocalización",
    plain: "Datos de dónde está o se mueve una persona, como el GPS del teléfono. Exigen permiso e información reforzada, y cuidado extra si se comparten con terceros.",
    example: "El seguimiento de repartidores debe informar qué se registra, para qué se usa y cuándo se apaga fuera de turno.",
  },
  {
    slug: "investigacion-interes-publico",
    term: "Investigación de interés público",
    plain: "Estudios con fines históricos, científicos o estadísticos que benefician a la sociedad. Solo valen con reglas estrictas y evitando datos identificables cuando sea posible.",
    example: "Un estudio universitario con fichas médicas debe trabajar con datos anonimizados y mantener la finalidad exclusivamente investigativa.",
  },
  {
    slug: "titulo-iii",
    term: "Título III: datos económicos y comerciales",
    plain: "Reglas especiales para datos de deudas, créditos, cheques protestados y similares. Cada detalle importa: si la deuda se pagó, se repactó o prescribió, puede que ya no pueda informarse.",
    example: "Una deuda pagada la semana pasada debe bajarse del informe comercial: ya no cumple las condiciones para seguir publicada.",
  },
  {
    slug: "dpo",
    term: "DPO (encargado de prevención)",
    plain: "La persona experta que ayuda a la empresa a cumplir la ley de datos: orienta, atiende consultas y es el contacto ante la Agencia. Es un rol propio, distinto del abogado o del informático.",
    example: "El plan anual del DPO suele incluir capacitaciones, revisiones de tratamientos y un canal de consultas con dedicación definida.",
  },
  {
    slug: "idoneidad-dpo",
    term: "Idoneidad del DPO",
    plain: "Que el DPO tenga conocimientos y experiencia comprobables para el cargo. Nombrar a alguien sin preparación no cumple el estándar.",
    example: "Una carpeta con formación, experiencia y cursos acredita la idoneidad del DPO frente a una fiscalización.",
  },
  {
    slug: "autonomia-dpo",
    term: "Autonomía del DPO y conflicto de interés",
    plain: "El DPO debe poder opinar técnicamente aunque incomode a su jefatura. Hay conflicto si la misma persona decide cómo usar los datos y a la vez debe controlar ese uso.",
    example: "No conviene que la jefatura de datos y el rol de DPO recaigan en la misma persona: quien decide el tratamiento no debería controlarse a sí misma.",
  },
  {
    slug: "deber-confidencialidad",
    term: "Deber de confidencialidad del DPO",
    plain: "El DPO debe guardar secreto de lo que conoce en su trabajo, incluso después de dejar el cargo.",
    example: "Al dejar el cargo, los pendientes se entregan sin llevarse copias de reclamos ni fichas: la reserva sigue vigente.",
  },
  {
    slug: "mpi",
    term: "MPI (Modelo de Prevención de Infracciones)",
    plain: "El programa interno de la empresa para prevenir infracciones a la ley de datos: reglas, responsables, controles, capacitación y sanciones internas. No es una certificación ISO ni un simple protocolo.",
    example: "Un MPI funcionando incluye reglamento actualizado, responsables por área y un calendario de revisiones con evidencia.",
  },
  {
    slug: "mpi-ciclo-certificacion",
    term: "Adopción, ciclo de vida y certificación del MPI",
    plain: "Tres momentos distintos: adoptar (decidir formalmente tener el modelo), mantenerlo vivo (revisarlo y mejorarlo) y certificarlo (que un tercero independiente lo evalúe). Tener documentos no equivale a estar certificado.",
    example: "Ante el directorio conviene distinguir: el MPI puede estar adoptado y en mantención, mientras la certificación externa sigue pendiente de auditoría.",
  },
  {
    slug: "agencia",
    term: "Agencia de Protección de Datos",
    plain: "El organismo público que fiscaliza, recibe reclamos de titulares y puede sancionar. No es un tribunal ni el SERNAC.",
    example: "Un reclamo ante la Agencia se responde con plazos controlados, evidencia del tratamiento y las medidas correctivas adoptadas.",
  },
  {
    slug: "canal-denuncias",
    term: "Canal de denuncias interno",
    plain: "Un buzón interno y protegido para avisar de problemas con datos, con reserva de identidad y sin represalias. No es el libro de reclamos de clientes.",
    example: "Quien reporte un acceso indebido a datos debe quedar protegido y recibir respuesta sobre lo informado.",
  },
  {
    slug: "regimen-disciplinario",
    term: "Régimen disciplinario y reglamento interno",
    plain: "Las sanciones internas cuando alguien rompe las reglas del modelo de prevención. Deben estar escritas en el reglamento y reflejadas en los contratos.",
    example: "Compartir claves de acceso debería quedar tipificado y sancionado en el reglamento interno, en coordinación con recursos humanos.",
  },
  {
    slug: "hallazgo-escalamiento",
    term: "Hallazgo y escalamiento de infracción",
    plain: "Hallazgo es un problema detectado y registrado; escalamiento es avisar hacia arriba para que se decida qué hacer. No es lo mismo que denunciar un delito.",
    example: "Una base de clientes sin respaldo se registra como hallazgo y se escala a gerencia con plazo y responsable de corrección.",
  },
  {
    slug: "inventario-tratamientos",
    term: "Inventario de tratamientos",
    plain: "La lista ordenada de todos los usos de datos de la empresa, uno por uno, con su finalidad, permiso, plazos y responsables. No es una bodega: es el registro de trabajo con datos.",
    example: "Nóminas, clientes, marketing y cámaras: cada uno con su ficha completa levantada con la jefatura correspondiente.",
  },
  {
    slug: "fines-medios",
    term: "Fines y medios",
    plain: "Quién decide el para qué (fines) y el cómo (medios) de los datos. Quien decide eso es el responsable del tratamiento.",
    example: "Aunque se externalice el hosting, la empresa sigue siendo responsable si ella define qué datos se tratan y para qué.",
  },
  {
    slug: "fuente-origen-trazabilidad",
    term: "Fuente, origen y trazabilidad",
    plain: "De dónde vino cada dato y el camino que siguió. Debe poder mostrarse: qué dato, entregado por quién, en qué formulario y fecha.",
    example: "Cada ficha de cliente debería indicar origen y fecha de captura para responder de dónde salió cada dato ante un reclamo.",
  },
  {
    slug: "fuente-acceso-publico",
    term: "Fuente de acceso público",
    plain: "Lugares abiertos a cualquiera por ley, como ciertos registros públicos. Que algo esté visible en internet o redes sociales no lo convierte en fuente pública de libre uso.",
    example: "Una base armada con perfiles sacados de redes sociales no es válida: estar publicados no autoriza a tratarlos libremente.",
  },
  {
    slug: "minimizacion",
    term: "Minimización",
    plain: "Pedir solo los datos que de verdad se necesitan para la finalidad, ni uno más. Tres filtros: ¿sirve?, ¿es necesario?, ¿tiene que ver con el fin?",
    example: "En un formulario de postulación sobran el estado civil y la foto si lo que se evalúa son las competencias del candidato.",
  },
  {
    slug: "calidad-datos",
    term: "Calidad de datos",
    plain: "Que los datos estén correctos, completos, actualizados y sirvan para el fin. No es que “el sistema funcione”: son cuatro exigencias separadas que deben verificarse.",
    example: "Una revisión semestral de la base de clientes corrige direcciones y elimina registros duplicados.",
  },
  {
    slug: "conservacion",
    term: "Conservación y plazo de conservación",
    plain: "Cuánto tiempo se guardan los datos. Es un tiempo máximo, no mínimo: al cumplirse hay que borrarlos o anonimizarlos. Guardar “por si acaso” no es válido.",
    example: "Las grabaciones de cámaras conservadas 30 días deben borrarse automáticamente al cumplirse el plazo, con evidencia del borrado.",
  },
  {
    slug: "anonimizacion",
    term: "Anonimización",
    plain: "Dejar los datos de modo que nadie pueda saber a quién pertenecen, ni siquiera combinándolos con otra información. Es irreversible: quitar solo el nombre no basta.",
    example: "Unas estadísticas de atenciones solo pueden publicarse sin RUT ni fechas exactas que permitan reidentificar a alguien.",
  },
  {
    slug: "cesion-terceros",
    term: "Cesión o comunicación a terceros",
    plain: "Entregar o dar acceso a datos a otra empresa o persona: enviar, publicar o permitir ver. No es lo mismo que encargar a un proveedor que trabaja bajo instrucciones.",
    example: "Entregar la cartera a una empresa de cobranza es cesión y exige base; pasarla al hosting contratado es encargo regulado por contrato.",
  },
  {
    slug: "transferencia-internacional",
    term: "Transferencia internacional",
    plain: "Enviar datos a otro país. No es un tema solo técnico: importa si el país destino protege adecuadamente los datos o si existen garantías contractuales.",
    example: "Antes de migrar a un CRM alojado en el extranjero hay que revisar qué país guarda los datos y qué cláusulas firmará el proveedor.",
  },
  {
    slug: "nivel-adecuado-garantias",
    term: "Nivel adecuado y garantías",
    plain: "Las dos vías para enviar datos al extranjero: porque el país destino protege en forma adecuada, o porque hay contratos y medidas que garantizan la protección.",
    example: "Una transferencia a un proveedor extranjero se documenta con el análisis del país destino y las cláusulas firmadas como garantía.",
  },
  {
    slug: "politica-transparencia",
    term: "Política de tratamiento y transparencia",
    plain: "El documento público donde la empresa explica qué datos trata, para qué, con qué permiso y cómo ejercer derechos. La ley exige contenidos mínimos: una “política de privacidad” genérica no basta.",
    example: "La política publicada en la web debe listar los tratamientos, sus finalidades, los permisos y el correo para ejercer derechos.",
  },
  {
    slug: "prueba-consentimiento",
    term: "Prueba del consentimiento",
    plain: "La empresa debe poder demostrar que la persona aceptó: cuándo, cómo y qué aceptó exactamente. Decir “aceptó” sin registro no sirve.",
    example: "El registro del clic de aceptación —fecha, texto aceptado y versión del formulario— debe poder recuperarse ante un reclamo.",
  },
  {
    slug: "retiro-consentimiento",
    term: "Retiro del consentimiento",
    plain: "La persona puede quitar su permiso en cualquier momento, en forma fácil, gratuita y permanente. Vale hacia adelante: lo ya hecho con permiso no se invalida.",
    example: "Cada correo comercial debería llevar un enlace de baja que funcione de inmediato, sin pedir explicaciones.",
  },
  {
    slug: "derecho-acceso",
    term: "Derecho de acceso",
    plain: "El derecho de la persona a pedir y recibir copia de sus datos, con explicación de para qué se usan y a quién se entregaron. No es “entrar a una cuenta”.",
    example: "Una solicitud de acceso se responde con la copia de los datos, las finalidades y los destinatarios, dentro del plazo legal.",
  },
  {
    slug: "rectificacion",
    term: "Rectificación",
    plain: "El derecho a corregir datos incorrectos o desactualizados. Si ya se compartieron, hay que avisar la corrección a quienes los recibieron, salvo que sea imposible.",
    example: "Un domicilio corregido debe actualizarse en todas las bases y avisarse al proveedor de despacho que ya lo tenía.",
  },
  {
    slug: "supresion",
    term: "Supresión",
    plain: "El derecho a que borren los datos cuando corresponde por ley, por ejemplo si se usaron sin permiso o cumplieron su fin. No siempre procede: hay excepciones como juicios o salud.",
    example: "Ante el borrado pedido por un excliente hay que verificar que no exista un juicio vigente ni una obligación de conservar antes de suprimir.",
  },
  {
    slug: "datos-caducos",
    term: "Datos caducos y tratamiento ilícito",
    plain: "Caduco no significa “vencido”: es el dato que por ley ya debe borrarse. Tratamiento ilícito es usar datos fuera de lo que la ley permite.",
    example: "Una base con deudas de hace 15 años aún informadas debe suprimirse por caduca.",
  },
  {
    slug: "oposicion",
    term: "Oposición",
    plain: "El derecho a decir “no usen mis datos para esto”, por ejemplo para publicidad. Si la oposición procede, la empresa debe detener ese uso.",
    example: "Un cliente que se opone al marketing debe salir de la lista y no volver a entrar en la próxima campaña.",
  },
  {
    slug: "marketing-directo",
    term: "Marketing directo",
    plain: "Ofertas enviadas directamente a una persona. La persona puede oponerse y la empresa debe dejar de enviarle ese tipo de mensajes.",
    example: "Cada oposición al marketing debería bloquear al contacto en la plataforma de envíos el mismo día.",
  },
  {
    slug: "bloqueo-temporal",
    term: "Bloqueo temporal",
    plain: "Congelar temporalmente el uso de los datos mientras se resuelve un reclamo, para que no se sigan usando ni se borren. No es borrar ni suspender una cuenta.",
    example: "La ficha disputada por un cliente se congela mientras se verifica su reclamo, impidiendo su uso comercial.",
  },
  {
    slug: "portabilidad",
    term: "Portabilidad",
    plain: "El derecho a recibir los datos en un formato ordenado y común para llevarlos a otro proveedor, o pedir su envío directo. Solo vale en ciertos casos, como datos automatizados entregados con consentimiento.",
    example: "El historial de compras puede entregarse en una planilla estándar para que el cliente se lo lleve a la competencia.",
  },
  {
    slug: "acuse-recibo",
    term: "Acuse de recibo",
    plain: "El comprobante formal de que la empresa recibió la solicitud de derechos, con fecha. No es un simple “mensaje recibido”.",
    example: "Cada solicitud debería generar un folio con fecha y hora que se envía al titular como comprobante.",
  },
  {
    slug: "autenticacion-solicitante",
    term: "Autenticación del solicitante",
    plain: "Verificar que quien pide los datos es de verdad el titular o su representante antes de entregar nada. No es un login: es una revisión exigida por el procedimiento.",
    example: "Ante una solicitud por correo se pide cédula o poder antes de enviar cualquier dato personal.",
  },
  {
    slug: "denegacion-reclamacion",
    term: "Denegación fundada y reclamación",
    plain: "Si la empresa dice no a una solicitud, debe explicarlo por escrito con motivos. Con esa respuesta, la persona puede reclamar ante la Agencia dentro del plazo.",
    example: "Negar un borrado por un juicio vigente exige explicar la causa por escrito e informar el derecho a reclamar.",
  },
  {
    slug: "gratuidad-costos",
    term: "Gratuidad y costos directos",
    plain: "Ejercer derechos es gratis. Solo puede cobrarse el costo directo de entregar copias, cuando la regulación lo permite.",
    example: "Responder solicitudes no se cobra; solo un copiado voluminoso podría evaluarse según la regla aplicable.",
  },
  {
    slug: "plazos-derechos",
    term: "Plazos: días corridos y hábiles",
    plain: "Los plazos se cuentan distinto: los días corridos incluyen fines de semana; los hábiles excluyen sábados, domingos y festivos. Cada derecho tiene su propio plazo.",
    example: "El control de vencimientos de cada solicitud debe marcar si el plazo es en días corridos o hábiles para no atrasarse.",
  },
  {
    slug: "decision-automatizada-perfilado",
    term: "Decisión automatizada y perfilado",
    plain: "Cuando un sistema decide sobre una persona sin revisión humana real, o la clasifica para predecir gustos o riesgos. Si le afecta en forma importante, la persona tiene derechos y salvaguardas especiales.",
    example: "Un sistema que rechaza créditos automáticamente debe revisarse: puede calificar como decisión automatizada con derechos que informar.",
  },
  {
    slug: "salvaguardas-8bis",
    term: "Salvaguardas",
    plain: "Las protecciones frente a decisiones automáticas: explicar la lógica, asegurar revisión por una persona real, recibir el punto de vista del afectado y permitir pedir revisión.",
    example: "Un sistema de selección de personal debe explicar su lógica al candidato y ofrecer revisión humana e impugnación del resultado.",
  },
  {
    slug: "eipd",
    term: "EIPD (evaluación de impacto)",
    plain: "Un estudio previo para detectar los riesgos de un uso de datos que puede ser peligroso. Se hace antes de partir, no después del problema.",
    example: "La evaluación de un reconocimiento facial en sucursales se hace antes de comprar los equipos, y puede terminar descartando el proyecto.",
  },
  {
    slug: "persona-natural-juridica",
    term: "Persona natural y persona jurídica",
    plain: "Persona natural es un ser humano; persona jurídica es una empresa u organización creada por ley. La ley de datos protege a las personas naturales.",
    example: "Los datos de la empresa proveedora como tal no son personales, pero los de su representante sí lo son.",
  },
  {
    slug: "mandatario-representante",
    term: "Mandatario, representante y cuidado personal",
    plain: "Personas que actúan por otra con un permiso escrito. El cuidado personal indica quién cuida a un niño y puede autorizar por él en ciertos casos.",
    example: "Hay que verificar el poder del abogado que pide datos de su cliente, o la autorización de la madre para el dato sensible de su hijo menor de 16.",
  },
  {
    slug: "herederos",
    term: "Ejercicio por herederos",
    plain: "Tras el fallecimiento, ciertas personas cercanas pueden ejercer algunos derechos sobre los datos del fallecido, con límites legales.",
    example: "La solicitud de una hija sobre los datos de su padre fallecido exige verificar su calidad de heredera y los límites aplicables.",
  },
  {
    slug: "individualizacion",
    term: "Individualización",
    plain: "Identificar en forma completa: nombre, RUT, domicilio y contacto. Decir solo “la empresa” o “el cliente” no basta.",
    example: "Una política publicada sin domicilio ni correo de contacto no cumple transparencia: le falta individualización.",
  },
  {
    slug: "hecho-desconocido-conflicto",
    term: "Hecho, desconocido y conflicto",
    plain: "Hecho es un dato del diagnóstico, como “tiene DPO”. Desconocido no significa “no”: significa “aún no se sabe”. Conflicto es cuando dos fuentes dicen cosas distintas y un profesional debe resolverlo.",
    example: "“Tiene cámaras” se marca desconocido hasta visitar la sucursal, en vez de asumir que no; y si dos áreas dicen cosas distintas, se resuelve el conflicto.",
  },
  {
    slug: "juicio-profesional-razonamiento",
    term: "Juicio profesional y registro de razonamiento",
    plain: "Cuando la ley no da una respuesta automática, el profesional debe analizar, decidir y dejar por escrito el porqué, con hechos, alternativas y fundamentos.",
    example: "Descartar cierto monitoreo por interés legítimo debe quedar documentado: hechos, alternativas evaluadas y conclusión firmada.",
  },
  {
    slug: "ambito-ejecucion",
    term: "Ámbito empresa, tratamiento o finalidad",
    plain: "El nivel al que se responde en la herramienta: empresa (todo), tratamiento (un uso concreto) o finalidad (un para qué dentro de ese uso). Cambiar de nivel cambia la respuesta.",
    example: "La guía de licitud se responde a nivel de cada finalidad del tratamiento de clientes, no una sola vez para toda la empresa.",
  },
  {
    slug: "alerta-sanitaria",
    term: "Alerta sanitaria decretada",
    plain: "Una emergencia de salud declarada oficialmente por la autoridad. Solo esa declaración formal habilita ciertos usos especiales de datos de salud, no cualquier emergencia.",
    example: "Antes de habilitar un flujo especial de datos de salud hay que verificar que el decreto correspondiente esté vigente.",
  },
  {
    slug: "muestras-biologicas",
    term: "Muestras biológicas",
    plain: "Partes del cuerpo o fluidos, como sangre o saliva, que permiten identificar a una persona. Tienen prohibición propia además de las reglas de datos.",
    example: "En un laboratorio no pueden conservarse muestras identificables más allá de lo autorizado, y su gestión va separada de los resultados.",
  },
];

export function searchGlossary(term: string): GlossaryTerm[] {
  const q = normalizeText(term.trim());
  if (q === "") return GLOSSARY_TERMS;
  return GLOSSARY_TERMS.filter((g) =>
    [g.term, g.plain, g.example].some((f) => normalizeText(f).includes(q)),
  );
}

/** Máximo de sugerencias del buscador predictivo del glosario flotante. */
export const GLOSSARY_SUGGESTION_LIMIT = 8;

export function suggestGlossaryTerms(term: string, limit = GLOSSARY_SUGGESTION_LIMIT): GlossaryTerm[] {
  const q = normalizeText(term.trim());
  if (q === "") return [];
  const starts: GlossaryTerm[] = [];
  const contains: GlossaryTerm[] = [];
  for (const g of GLOSSARY_TERMS) {
    const name = normalizeText(g.term);
    if (name.startsWith(q)) starts.push(g);
    else if (
      name.includes(q) ||
      normalizeText(g.plain).includes(q) ||
      normalizeText(g.example).includes(q)
    )
      contains.push(g);
    if (starts.length + contains.length >= limit * 2) break;
  }
  return [...starts, ...contains].slice(0, limit);
}
