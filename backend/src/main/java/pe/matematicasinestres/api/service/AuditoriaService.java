package pe.matematicasinestres.api.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.matematicasinestres.api.entity.AuditoriaAcceso;
import pe.matematicasinestres.api.entity.EventoAuditoria;
import pe.matematicasinestres.api.entity.Usuario;
import pe.matematicasinestres.api.repository.AuditoriaAccesoRepository;

/** Bitácora de eventos de seguridad (OWASP A09: registro y monitoreo). */
@Service
public class AuditoriaService {

    private final AuditoriaAccesoRepository repo;

    public AuditoriaService(AuditoriaAccesoRepository repo) {
        this.repo = repo;
    }

    @Transactional
    public void registrar(Usuario usuario, String identificador, EventoAuditoria evento, String detalle, String ip) {
        AuditoriaAcceso a = new AuditoriaAcceso();
        a.setUsuario(usuario);
        a.setIdentificador(recortar(identificador, 120));
        a.setEvento(evento);
        a.setDetalle(recortar(detalle, 255));
        a.setIp(recortar(ip, 45));
        repo.save(a);
    }

    private static String recortar(String s, int max) {
        if (s == null) {
            return null;
        }
        String limpio = s.replaceAll("[\\r\\n\\t]", " "); // evita inyección de líneas en logs
        return limpio.length() > max ? limpio.substring(0, max) : limpio;
    }
}
